using AutoMapper;
using Tickify.DTOs.Ticket;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Services.Email;
using System.Security.Cryptography;
using System.Text;

namespace Tickify.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ITicketTransferRepository _ticketTransferRepository;
    private readonly ITicketScanRepository _ticketScanRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEventRepository _eventRepository;
    private readonly Email.IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;

    public TicketService(
        ITicketRepository ticketRepository,
        IBookingRepository bookingRepository,
        ITicketTransferRepository ticketTransferRepository,
        ITicketScanRepository ticketScanRepository,
        IUserRepository userRepository,
        IEventRepository eventRepository,
        Email.IEmailService emailService,
        INotificationService notificationService,
        IMapper mapper)
    {
        _ticketRepository = ticketRepository;
        _bookingRepository = bookingRepository;
        _ticketTransferRepository = ticketTransferRepository;
        _ticketScanRepository = ticketScanRepository;
        _userRepository = userRepository;
        _eventRepository = eventRepository;
        _emailService = emailService;
        _notificationService = notificationService;
        _mapper = mapper;
    }

    public async Task<TicketDto> GetByIdAsync(int id)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id);
        if (ticket == null)
            throw new NotFoundException($"Ticket with ID {id} not found");

        return _mapper.Map<TicketDto>(ticket);
    }

    public async Task<TicketDto> GetByTicketCodeAsync(string ticketCode)
    {
        var ticket = await _ticketRepository.GetByTicketCodeAsync(ticketCode);
        if (ticket == null)
            throw new NotFoundException($"Ticket with code {ticketCode} not found");

        return _mapper.Map<TicketDto>(ticket);
    }

    public async Task<IEnumerable<TicketDto>> GetByBookingIdAsync(int bookingId)
    {
        var tickets = await _ticketRepository.GetByBookingIdAsync(bookingId);
        return _mapper.Map<IEnumerable<TicketDto>>(tickets);
    }

    public async Task<IEnumerable<TicketDetailDto>> GetUserTicketsAsync(int userId)
    {
        var tickets = await _ticketRepository.GetByUserIdAsync(userId);
        return _mapper.Map<IEnumerable<TicketDetailDto>>(tickets);
    }

    public async Task<TicketDto> TransferTicketAsync(int ticketId, TicketTransferDto transferDto, int userId)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId);
        if (ticket == null)
            throw new NotFoundException($"Ticket with ID {ticketId} not found");

        // Validate ownership through booking
        var booking = await _bookingRepository.GetByIdAsync(ticket.BookingId);
        if (booking == null || booking.UserId != userId)
            throw new UnauthorizedException("You are not authorized to transfer this ticket");

        if (ticket.Status != TicketStatus.Valid)
            throw new BadRequestException("Only valid tickets can be transferred");

        // Check if event allows transfer
        var eventData = await _eventRepository.GetByIdAsync(booking.EventId);
        if (eventData == null)
            throw new NotFoundException($"Event not found");
        
        if (!eventData.AllowTransfer)
            throw new BadRequestException("This event does not allow ticket transfers");

        // Get recipient user by email
        var recipientUser = await _userRepository.GetUserByEmailAsync(transferDto.RecipientEmail);
        if (recipientUser == null)
            throw new NotFoundException($"User with email {transferDto.RecipientEmail} not found");

        if (recipientUser.Id == userId)
            throw new BadRequestException("You cannot transfer a ticket to yourself");

        // Create transfer record
        var ticketTransfer = new TicketTransfer
        {
            TicketId = ticketId,
            FromUserId = userId,
            ToUserId = recipientUser.Id,
            TransferredAt = DateTime.UtcNow,
            Reason = transferDto.Message,
            IsApproved = false // Pending recipient acceptance
        };

        // Generate acceptance token and expiry, store on transfer
        var tokenBytes = new byte[32];
        RandomNumberGenerator.Fill(tokenBytes);
        var acceptanceToken = Convert.ToBase64String(tokenBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        ticketTransfer.AcceptanceToken = acceptanceToken;
        ticketTransfer.AcceptanceExpiresAt = DateTime.UtcNow.AddDays(7);

        var createdTransfer = await _ticketTransferRepository.CreateAsync(ticketTransfer);

        // Send email notification to recipient
        var sender = await _userRepository.GetUserByIdAsync(userId);
        await _emailService.SendTicketTransferNotificationAsync(
            recipientEmail: transferDto.RecipientEmail,
            recipientName: recipientUser.FullName ?? recipientUser.Email,
            senderName: sender?.FullName ?? sender?.Email ?? "A user",
            ticketCode: ticket.TicketCode,
            message: transferDto.Message ?? string.Empty,
            acceptanceToken: acceptanceToken,
            transferId: createdTransfer.Id
        );

        return _mapper.Map<TicketDto>(ticket);
    }

    public async Task<TicketDto> AcceptTransferAsync(AcceptTransferDto acceptTransferDto, int userId)
    {
        // Get transfer record
        var transfer = await _ticketTransferRepository.GetByIdAsync(acceptTransferDto.TransferId);
        if (transfer == null)
            throw new NotFoundException($"Transfer not found");

        // Get recipient user info for better error message
        var recipientUser = await _userRepository.GetUserByIdAsync(transfer.ToUserId);
        var currentUser = await _userRepository.GetUserByIdAsync(userId);
        
        if (transfer.ToUserId != userId)
        {
            var expectedEmail = recipientUser?.Email ?? "unknown";
            var currentEmail = currentUser?.Email ?? "unknown";
            throw new UnauthorizedException(
                $"This transfer was sent to {expectedEmail}. You are currently logged in as {currentEmail}. Please login with the correct account to accept this transfer."
            );
        }

        if (transfer.IsApproved)
            throw new BadRequestException("This transfer has already been accepted");

        // Validate acceptance token
        if (string.IsNullOrWhiteSpace(transfer.AcceptanceToken) || acceptTransferDto.AcceptanceToken != transfer.AcceptanceToken)
            throw new BadRequestException("Invalid acceptance token");

        if (transfer.AcceptanceExpiresAt.HasValue && transfer.AcceptanceExpiresAt.Value < DateTime.UtcNow)
            throw new BadRequestException("Acceptance token has expired");

        // Get the ticket
        var ticket = await _ticketRepository.GetByIdAsync(transfer.TicketId);
        if (ticket == null)
            throw new NotFoundException("Ticket not found");

        if (ticket.Status != TicketStatus.Valid)
            throw new BadRequestException("Ticket is not valid for transfer");

        // Get original booking
        var oldBooking = await _bookingRepository.GetByIdAsync(ticket.BookingId);
        if (oldBooking == null)
            throw new NotFoundException("Original booking not found");

        // Create new booking for recipient
        var newBooking = new Booking
        {
            UserId = userId,
            EventId = oldBooking.EventId,
            BookingCode = GenerateBookingCode(),
            TotalAmount = 0, // Transferred tickets have no cost
            DiscountAmount = 0,
            Status = BookingStatus.Confirmed,
            BookingDate = DateTime.UtcNow
        };

        var createdBooking = await _bookingRepository.CreateAsync(newBooking);

        // Update ticket with new booking
        ticket.BookingId = createdBooking.Id;
        var updatedTicket = await _ticketRepository.UpdateAsync(ticket);

        // Mark transfer as approved
        // Note: transfer entity is already tracked from GetByIdAsync, so we can modify it directly
        transfer.IsApproved = true;
        transfer.ApprovedByUserId = userId;
        
        // Save changes - the repository will handle the update
        var updatedTransfer = await _ticketTransferRepository.UpdateAsync(transfer);
        
        // Send email notifications
        try
        {
            // Get sender and recipient user info
            var sender = await _userRepository.GetUserByIdAsync(transfer.FromUserId);
            var recipient = await _userRepository.GetUserByIdAsync(userId);
            
            // Send notification to sender
            if (sender != null && !string.IsNullOrEmpty(sender.Email))
            {
                await _emailService.SendTicketTransferAcceptedNotificationAsync(
                    senderEmail: sender.Email,
                    senderName: sender.FullName ?? sender.Email,
                    recipientName: recipient?.FullName ?? recipient?.Email ?? "A user",
                    ticketCode: ticket.TicketCode
                );
            }
            
            // Send confirmation to recipient
            if (recipient != null && !string.IsNullOrEmpty(recipient.Email))
            {
                await _emailService.SendTicketTransferAcceptedConfirmationAsync(
                    recipientEmail: recipient.Email,
                    recipientName: recipient.FullName ?? recipient.Email,
                    ticketCode: ticket.TicketCode
                );
            }

            // Send in-app notification to recipient
            var eventEntity = await _eventRepository.GetByIdAsync(oldBooking.EventId);
            if (eventEntity != null && sender != null)
            {
                await _notificationService.NotifyTicketTransferAsync(
                    userId,
                    ticket.Id,
                    eventEntity.Title,
                    sender.FullName ?? sender.Email
                );
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail the transfer
            // Email sending failure shouldn't prevent transfer completion
        }
        
        return _mapper.Map<TicketDto>(updatedTicket);
    }

    public async Task<bool> RejectTransferAsync(AcceptTransferDto rejectTransferDto, int userId)
    {
        // Get transfer record
        var transfer = await _ticketTransferRepository.GetByIdAsync(rejectTransferDto.TransferId);
        if (transfer == null)
            throw new NotFoundException($"Transfer not found");

        if (transfer.ToUserId != userId)
            throw new UnauthorizedException("You are not authorized to reject this transfer");

        if (transfer.IsApproved)
            throw new BadRequestException("This transfer has already been accepted and cannot be rejected");

        // Validate acceptance token
        if (string.IsNullOrWhiteSpace(transfer.AcceptanceToken) || rejectTransferDto.AcceptanceToken != transfer.AcceptanceToken)
            throw new BadRequestException("Invalid acceptance token");

        if (transfer.AcceptanceExpiresAt.HasValue && transfer.AcceptanceExpiresAt.Value < DateTime.UtcNow)
            throw new BadRequestException("Acceptance token has expired");

        // Get ticket and user info before deleting transfer record
        var ticket = await _ticketRepository.GetByIdAsync(transfer.TicketId);
        var sender = await _userRepository.GetUserByIdAsync(transfer.FromUserId);
        var recipient = await _userRepository.GetUserByIdAsync(userId);

        // Delete the transfer record to reject it
        await _ticketTransferRepository.DeleteAsync(transfer.Id);

        // Send email notifications
        try
        {
            // Send notification to sender
            if (sender != null && !string.IsNullOrEmpty(sender.Email) && ticket != null)
            {
                await _emailService.SendTicketTransferRejectedNotificationAsync(
                    senderEmail: sender.Email,
                    senderName: sender.FullName ?? sender.Email,
                    recipientName: recipient?.FullName ?? recipient?.Email ?? "A user",
                    ticketCode: ticket.TicketCode
                );
            }
            
            // Send confirmation to recipient
            if (recipient != null && !string.IsNullOrEmpty(recipient.Email) && ticket != null)
            {
                await _emailService.SendTicketTransferRejectedConfirmationAsync(
                    recipientEmail: recipient.Email,
                    recipientName: recipient.FullName ?? recipient.Email,
                    ticketCode: ticket.TicketCode
                );
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail the rejection
            // Email sending failure shouldn't prevent transfer rejection
        }

        return true;
    }

    public async Task<TicketDto> ScanTicketAsync(TicketScanDto scanDto)
    {
        var ticket = await _ticketRepository.GetByTicketCodeAsync(scanDto.TicketNumber);
        if (ticket == null)
            throw new NotFoundException($"Ticket not found");

        // Validate ticket belongs to the event
        var booking = await _bookingRepository.GetByIdAsync(ticket.BookingId);
        if (booking == null || booking.EventId != scanDto.EventId)
            throw new BadRequestException("Ticket does not belong to this event");

        if (ticket.Status == TicketStatus.Used)
            throw new BadRequestException("Ticket has already been used");

        if (ticket.Status != TicketStatus.Valid)
            throw new BadRequestException($"Ticket is not valid. Status: {ticket.Status}");

        // Create scan record
        var ticketScan = new TicketScan
        {
            TicketId = ticket.Id,
            ScannedAt = DateTime.UtcNow,
            ScannedByUserId = scanDto.ScannedByUserId ?? 0, // Use from DTO or default
            ScanLocation = scanDto.ScanLocation ?? "Main Entrance",
            ScanType = scanDto.ScanType ?? "Entry",
            DeviceId = scanDto.DeviceId,
            IsValid = true,
            Notes = scanDto.Notes
        };

        await _ticketScanRepository.CreateAsync(ticketScan);

        // Mark ticket as used
        ticket.Status = TicketStatus.Used;
        ticket.UsedAt = DateTime.UtcNow;

        var updatedTicket = await _ticketRepository.UpdateAsync(ticket);
        return _mapper.Map<TicketDto>(updatedTicket);
    }

    public async Task<bool> ValidateTicketAsync(string ticketCode, int eventId)
    {
        return await _ticketRepository.IsTicketValidAsync(ticketCode, eventId);
    }

    public async Task<IEnumerable<TicketDto>> GetTransferableTicketsAsync(int userId, int bookingId)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {bookingId} not found");

        if (booking.UserId != userId)
            throw new UnauthorizedException("You are not authorized to view this booking's tickets");

        var tickets = await _ticketRepository.GetByBookingIdAsync(bookingId);
        var transferableTickets = tickets.Where(t => t.Status == TicketStatus.Valid);

        return _mapper.Map<IEnumerable<TicketDto>>(transferableTickets);
    }

    private string GenerateBookingCode()
    {
        return $"BK{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    public async Task<IEnumerable<TicketTransferResponseDto>> GetPendingTransfersAsync(int userId)
    {
        var transfers = await _ticketTransferRepository.GetPendingTransfersAsync(userId);
        
        var result = new List<TicketTransferResponseDto>();
        foreach (var transfer in transfers)
        {
            result.Add(new TicketTransferResponseDto
            {
                Id = transfer.Id,
                TicketId = transfer.TicketId,
                TicketCode = transfer.Ticket?.TicketCode ?? string.Empty,
                FromUserId = transfer.FromUserId,
                FromUserName = transfer.FromUser?.FullName ?? transfer.FromUser?.Email ?? "Unknown",
                FromUserEmail = transfer.FromUser?.Email ?? string.Empty,
                ToUserId = transfer.ToUserId,
                ToUserName = transfer.ToUser?.FullName ?? transfer.ToUser?.Email ?? "Unknown",
                ToUserEmail = transfer.ToUser?.Email ?? string.Empty,
                TransferredAt = transfer.TransferredAt,
                Reason = transfer.Reason,
                IsApproved = transfer.IsApproved,
                AcceptanceExpiresAt = transfer.AcceptanceExpiresAt
            });
        }
        
        return result;
    }

    public async Task<int> GetUserTicketsCountAsync(int userId)
    {
        return await _ticketRepository.CountByUserIdAsync(userId);
    }

    private string GenerateAcceptanceToken(int transferId)
    {
        // Generate a secure cryptographic token using HMAC-SHA256
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var data = $"{transferId}:{timestamp}";
        
        using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes("YourSecureSecretKey_ChangeInProduction")))
        {
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            var token = Convert.ToBase64String(hash);
            return $"{transferId}:{timestamp}:{token}";
        }
    }
}
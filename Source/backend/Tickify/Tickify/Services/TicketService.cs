using AutoMapper;
using Tickify.DTOs.Ticket;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ITicketTransferRepository _ticketTransferRepository;
    private readonly ITicketScanRepository _ticketScanRepository;
    private readonly IMapper _mapper;

    public TicketService(
        ITicketRepository ticketRepository,
        IBookingRepository bookingRepository,
        ITicketTransferRepository ticketTransferRepository,
        ITicketScanRepository ticketScanRepository,
        IMapper mapper)
    {
        _ticketRepository = ticketRepository;
        _bookingRepository = bookingRepository;
        _ticketTransferRepository = ticketTransferRepository;
        _ticketScanRepository = ticketScanRepository;
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

        // TODO: Get recipient user ID from email (for now, use transferDto.TransferId as recipient ID)
        // In production: Look up user by email, send notification email
        int recipientUserId = transferDto.RecipientEmail.GetHashCode(); // Placeholder

        // Create transfer record
        var ticketTransfer = new TicketTransfer
        {
            TicketId = ticketId,
            FromUserId = userId,
            ToUserId = recipientUserId, // TODO: Get from user lookup by email
            TransferredAt = DateTime.UtcNow,
            Reason = transferDto.Message,
            IsApproved = false // Pending recipient acceptance
        };

        await _ticketTransferRepository.CreateAsync(ticketTransfer);

        // TODO: Send email notification to recipient with acceptance link

        return _mapper.Map<TicketDto>(ticket);
    }

    public async Task<TicketDto> AcceptTransferAsync(AcceptTransferDto acceptTransferDto, int userId)
    {
        // Get transfer record
        var transfer = await _ticketTransferRepository.GetByIdAsync(acceptTransferDto.TransferId);
        if (transfer == null)
            throw new NotFoundException($"Transfer not found");

        if (transfer.ToUserId != userId)
            throw new UnauthorizedException("You are not authorized to accept this transfer");

        if (transfer.IsApproved)
            throw new BadRequestException("This transfer has already been accepted");

        // Validate acceptance token
        if (acceptTransferDto.AcceptanceToken != GenerateAcceptanceToken(transfer.Id))
            throw new BadRequestException("Invalid acceptance token");

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
        transfer.IsApproved = true;
        await _ticketTransferRepository.UpdateAsync(transfer);
        
        return _mapper.Map<TicketDto>(updatedTicket);
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
            ScannedByUserId = scanDto.EventId, // TODO: Get actual scanner user ID from authenticated user
            ScanLocation = "Main Entrance", // TODO: Get from scanDto or device
            ScanType = "Entry",
            DeviceId = null, // TODO: Get from request
            IsValid = true,
            Notes = null
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

    private string GenerateAcceptanceToken(int ticketId)
    {
        // In real application, this should be a secure cryptographic token
        return $"TOKEN_{ticketId}_{DateTime.UtcNow:yyyyMMddHHmmss}";
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Seat;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services;

public class SeatService : ISeatService
{
    private readonly ISeatRepository _seatRepository;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SeatService(ISeatRepository seatRepository, ApplicationDbContext context, IMapper mapper)
    {
        _seatRepository = seatRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<SeatDto?> GetByIdAsync(int id)
    {
        var seat = await _context.Seats
            .Include(s => s.TicketType)
            .Include(s => s.SeatZone)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (seat == null)
            return null;

        var dto = _mapper.Map<SeatDto>(seat);
        dto.TicketTypeName = seat.TicketType?.Name;
        dto.TicketTypePrice = seat.TicketType?.Price;
        dto.ZoneName = seat.SeatZone?.Name;
        
        return dto;
    }

    public async Task<IEnumerable<SeatDto>> GetByEventIdAsync(int eventId)
    {
        var seats = await _context.Seats
            .Include(s => s.TicketType)
            .Include(s => s.SeatZone)
            .Where(s => s.TicketType.EventId == eventId)
            .OrderBy(s => s.Row)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync();

        return seats.Select(seat =>
        {
            var dto = _mapper.Map<SeatDto>(seat);
            dto.TicketTypeName = seat.TicketType?.Name;
            dto.TicketTypePrice = seat.TicketType?.Price;
            dto.ZoneName = seat.SeatZone?.Name;
            return dto;
        });
    }

    public async Task<IEnumerable<SeatDto>> GetByTicketTypeIdAsync(int ticketTypeId)
    {
        var seats = await _context.Seats
            .Include(s => s.TicketType)
            .Include(s => s.SeatZone)
            .Where(s => s.TicketTypeId == ticketTypeId)
            .OrderBy(s => s.Row)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync();

        return seats.Select(seat =>
        {
            var dto = _mapper.Map<SeatDto>(seat);
            dto.TicketTypeName = seat.TicketType?.Name;
            dto.TicketTypePrice = seat.TicketType?.Price;
            dto.ZoneName = seat.SeatZone?.Name;
            return dto;
        });
    }

    public async Task<SeatAvailabilityDto> GetSeatAvailabilityAsync(int ticketTypeId)
    {
        var ticketType = await _context.TicketTypes.FindAsync(ticketTypeId);
        if (ticketType == null)
            throw new NotFoundException($"Ticket type with ID {ticketTypeId} not found");

        var seats = await _context.Seats
            .Include(s => s.TicketType)
            .Include(s => s.SeatZone)
            .Where(s => s.TicketTypeId == ticketTypeId)
            .OrderBy(s => s.Row)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync();

        var seatDtos = seats.Select(seat =>
        {
            var dto = _mapper.Map<SeatDto>(seat);
            dto.TicketTypeName = seat.TicketType?.Name;
            dto.TicketTypePrice = seat.TicketType?.Price;
            dto.ZoneName = seat.SeatZone?.Name;
            return dto;
        }).ToList();

        return new SeatAvailabilityDto
        {
            TicketTypeId = ticketTypeId,
            TicketTypeName = ticketType.Name,
            Price = ticketType.Price,
            TotalSeats = seats.Count,
            AvailableSeats = seats.Count(s => s.Status == SeatStatus.Available),
            ReservedSeats = seats.Count(s => s.Status == SeatStatus.Reserved),
            SoldSeats = seats.Count(s => s.Status == SeatStatus.Sold),
            Seats = seatDtos
        };
    }

    public async Task<SeatDto> CreateSeatAsync(CreateSeatDto createSeatDto)
    {
        // Verify ticket type exists
        var ticketType = await _context.TicketTypes.FindAsync(createSeatDto.TicketTypeId);
        if (ticketType == null)
            throw new NotFoundException($"Ticket type with ID {createSeatDto.TicketTypeId} not found");

        // Check for duplicate seat
        var exists = await _context.Seats.AnyAsync(s =>
            s.TicketTypeId == createSeatDto.TicketTypeId &&
            s.Row == createSeatDto.Row &&
            s.SeatNumber == createSeatDto.SeatNumber);

        if (exists)
            throw new ConflictException($"Seat {createSeatDto.Row}{createSeatDto.SeatNumber} already exists for this ticket type");

        var seat = _mapper.Map<Seat>(createSeatDto);
        seat.Status = SeatStatus.Available;
        seat.IsBlocked = false;
        seat.CreatedAt = DateTime.UtcNow;

        _context.Seats.Add(seat);
        await _context.SaveChangesAsync();

        return _mapper.Map<SeatDto>(seat);
    }

    public async Task<IEnumerable<SeatDto>> CreateBulkSeatsAsync(BulkCreateSeatDto bulkCreateDto)
    {
        // Verify ticket type exists
        var ticketType = await _context.TicketTypes.FindAsync(bulkCreateDto.TicketTypeId);
        if (ticketType == null)
            throw new NotFoundException($"Ticket type with ID {bulkCreateDto.TicketTypeId} not found");

        // Check for duplicates within the request
        var duplicateSeats = bulkCreateDto.Seats
            .GroupBy(s => $"{s.Row}{s.SeatNumber}")
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicateSeats.Any())
            throw new BadRequestException($"Duplicate seats in request: {string.Join(", ", duplicateSeats)}");

        // Get existing seats for this ticket type
        var existingSeats = await _context.Seats
            .Where(s => s.TicketTypeId == bulkCreateDto.TicketTypeId)
            .Select(s => $"{s.Row}{s.SeatNumber}")
            .ToListAsync();

        // Filter out seats that already exist
        var newSeatItems = bulkCreateDto.Seats
            .Where(s => !existingSeats.Contains($"{s.Row}{s.SeatNumber}"))
            .ToList();

        if (!newSeatItems.Any())
            throw new BadRequestException("All seats already exist");

        var seats = newSeatItems.Select(item => new Seat
        {
            TicketTypeId = bulkCreateDto.TicketTypeId,
            SeatZoneId = bulkCreateDto.SeatZoneId,
            Row = item.Row,
            SeatNumber = item.SeatNumber,
            GridRow = item.GridRow,
            GridColumn = item.GridColumn,
            Status = SeatStatus.Available,
            IsBlocked = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        await _context.Seats.AddRangeAsync(seats);
        await _context.SaveChangesAsync();

        return _mapper.Map<IEnumerable<SeatDto>>(seats);
    }

    public async Task<SeatDto> BlockSeatAsync(int seatId, BlockSeatDto blockDto)
    {
        var seat = await _context.Seats.FindAsync(seatId);
        if (seat == null)
            throw new NotFoundException($"Seat with ID {seatId} not found");

        if (seat.Status == SeatStatus.Sold)
            throw new BadRequestException("Cannot block a sold seat");

        seat.IsBlocked = true;
        seat.BlockedReason = blockDto.Reason;
        seat.Status = SeatStatus.Blocked;
        seat.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<SeatDto>(seat);
    }

    public async Task<SeatDto> UnblockSeatAsync(int seatId)
    {
        var seat = await _context.Seats.FindAsync(seatId);
        if (seat == null)
            throw new NotFoundException($"Seat with ID {seatId} not found");

        if (!seat.IsBlocked)
            throw new BadRequestException("Seat is not blocked");

        seat.IsBlocked = false;
        seat.BlockedReason = null;
        seat.Status = SeatStatus.Available;
        seat.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<SeatDto>(seat);
    }

    public async Task<bool> ReserveSeatsAsync(IEnumerable<int> seatIds, int userId)
    {
        var seats = await _context.Seats
            .Where(s => seatIds.Contains(s.Id))
            .ToListAsync();

        if (seats.Count != seatIds.Count())
            throw new NotFoundException("One or more seats not found");

        var unavailableSeats = seats.Where(s => s.Status != SeatStatus.Available || s.IsBlocked).ToList();
        if (unavailableSeats.Any())
        {
            var unavailableList = string.Join(", ", unavailableSeats.Select(s => s.FullSeatCode));
            throw new BadRequestException($"Seats not available: {unavailableList}");
        }

        foreach (var seat in seats)
        {
            seat.Status = SeatStatus.Reserved;
            seat.ReservedByUserId = userId;
            seat.ReservedUntil = DateTime.UtcNow.AddMinutes(15); // 15 minute reservation
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReleaseSeatsAsync(IEnumerable<int> seatIds)
    {
        var seats = await _context.Seats
            .Where(s => seatIds.Contains(s.Id))
            .ToListAsync();

        foreach (var seat in seats)
        {
            if (seat.Status == SeatStatus.Reserved)
            {
                seat.Status = SeatStatus.Available;
                seat.ReservedByUserId = null;
                seat.ReservedUntil = null;
                seat.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReleaseExpiredReservationsAsync()
    {
        var expiredSeats = await _context.Seats
            .Where(s => s.Status == SeatStatus.Reserved && 
                       s.ReservedUntil.HasValue && 
                       s.ReservedUntil < DateTime.UtcNow)
            .ToListAsync();

        foreach (var seat in expiredSeats)
        {
            seat.Status = SeatStatus.Available;
            seat.ReservedByUserId = null;
            seat.ReservedUntil = null;
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CheckSeatAvailabilityAsync(int seatId)
    {
        var seat = await _context.Seats.FindAsync(seatId);
        return seat?.Status == SeatStatus.Available && !seat.IsBlocked;
    }

    public async Task<bool> AreSeatAvailableAsync(IEnumerable<int> seatIds)
    {
        var seats = await _context.Seats
            .Where(s => seatIds.Contains(s.Id))
            .ToListAsync();

        return seats.Count == seatIds.Count() && 
               seats.All(s => s.Status == SeatStatus.Available && !s.IsBlocked);
    }
}

using Tickify.DTOs.Seat;

namespace Tickify.Interfaces.Services;

public interface ISeatService
{
    // Get seat operations
    Task<SeatDto?> GetByIdAsync(int id);
    Task<IEnumerable<SeatDto>> GetByEventIdAsync(int eventId);
    Task<IEnumerable<SeatDto>> GetByTicketTypeIdAsync(int ticketTypeId);
    Task<SeatAvailabilityDto> GetSeatAvailabilityAsync(int ticketTypeId);
    
    // Create operations
    Task<SeatDto> CreateSeatAsync(CreateSeatDto createSeatDto);
    Task<IEnumerable<SeatDto>> CreateBulkSeatsAsync(BulkCreateSeatDto bulkCreateDto);
    
    // Block/Unblock operations
    Task<SeatDto> BlockSeatAsync(int seatId, BlockSeatDto blockDto);
    Task<SeatDto> UnblockSeatAsync(int seatId);
    
    // Reserve/Release operations (for booking flow)
    Task<bool> ReserveSeatsAsync(IEnumerable<int> seatIds, int userId);
    Task<bool> ReleaseSeatsAsync(IEnumerable<int> seatIds);
    Task<bool> ReleaseExpiredReservationsAsync();
    
    // Availability check
    Task<bool> CheckSeatAvailabilityAsync(int seatId);
    Task<bool> AreSeatAvailableAsync(IEnumerable<int> seatIds);
}

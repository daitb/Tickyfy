using Tickify.DTOs.Seat;

namespace Tickify.Interfaces.Services;

public interface ISeatService
{
    Task<SeatDto> GetByIdAsync(int id);
    Task<IEnumerable<SeatDto>> GetByEventIdAsync(int eventId);
    Task<SeatMapDto> GetSeatMapAsync(int eventId);
    Task<IEnumerable<SeatDto>> GetAvailableSeatsAsync(int eventId);
    Task<bool> ReserveSeatsAsync(IEnumerable<SeatSelectionDto> seatSelections);
    Task<bool> ReleaseSeatsAsync(IEnumerable<int> seatIds);
    Task<bool> CheckSeatAvailabilityAsync(int seatId);
    Task<SeatDto> CreateSeatAsync(CreateSeatDto createSeatDto);
    Task<IEnumerable<SeatDto>> CreateBulkSeatsAsync(IEnumerable<CreateSeatDto> createSeatDtos);
}

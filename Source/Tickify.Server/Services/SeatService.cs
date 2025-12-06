using AutoMapper;
using Tickify.DTOs.Seat;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services;

public class SeatService : ISeatService
{
    private readonly ISeatRepository _seatRepository;
    private readonly IMapper _mapper;

    public SeatService(ISeatRepository seatRepository, IMapper mapper)
    {
        _seatRepository = seatRepository;
        _mapper = mapper;
    }

    public async Task<SeatDto> GetByIdAsync(int id)
    {
        var seat = await _seatRepository.GetByIdAsync(id);
        if (seat == null)
            throw new NotFoundException($"Seat with ID {id} not found");

        return _mapper.Map<SeatDto>(seat);
    }

    public async Task<IEnumerable<SeatDto>> GetByEventIdAsync(int eventId)
    {
        var seats = await _seatRepository.GetByEventIdAsync(eventId);
        return _mapper.Map<IEnumerable<SeatDto>>(seats);
    }

    public async Task<SeatMapDto> GetSeatMapAsync(int eventId)
    {
        var seats = await _seatRepository.GetByEventIdAsync(eventId);
        var seatDtos = _mapper.Map<IEnumerable<SeatDto>>(seats).ToList();

        // Group seats by section and row
        var sections = seatDtos
            .GroupBy(s => s.Section)
            .Select(sectionGroup => new SeatSectionDto
            {
                Section = sectionGroup.Key,
                Rows = sectionGroup
                    .GroupBy(s => s.RowNumber)
                    .Select(rowGroup => new SeatRowDto
                    {
                        RowNumber = rowGroup.Key,
                        Seats = rowGroup.ToList()
                    })
                    .ToList()
            })
            .ToList();

        return new SeatMapDto
        {
            EventId = eventId,
            EventTitle = string.Empty, // TODO: Get from Event
            Sections = sections
        };
    }

    public async Task<IEnumerable<SeatDto>> GetAvailableSeatsAsync(int eventId)
    {
        var seats = await _seatRepository.GetAvailableSeatsAsync(eventId);
        return _mapper.Map<IEnumerable<SeatDto>>(seats);
    }

    public async Task<bool> ReserveSeatsAsync(IEnumerable<SeatSelectionDto> seatSelections, int userId)
    {
        var seatIds = seatSelections.Select(s => s.SeatId).ToList();
        
        // Check all seats are available
        foreach (var seatId in seatIds)
        {
            var isAvailable = await _seatRepository.IsSeatAvailableAsync(seatId);
            if (!isAvailable)
                throw new BadRequestException($"Seat with ID {seatId} is not available");
        }

        return await _seatRepository.ReserveSeatsAsync(seatIds, userId);
    }

    public async Task<bool> ReleaseSeatsAsync(IEnumerable<int> seatIds)
    {
        return await _seatRepository.AdminReleaseSeatsAsync(seatIds);
    }

    public async Task<bool> CheckSeatAvailabilityAsync(int seatId)
    {
        return await _seatRepository.IsSeatAvailableAsync(seatId);
    }

    public async Task<SeatDto> CreateSeatAsync(CreateSeatDto createSeatDto)
    {
        var seat = _mapper.Map<Seat>(createSeatDto);
        seat.CreatedAt = DateTime.UtcNow;
        seat.Status = SeatStatus.Available;

        var createdSeat = await _seatRepository.CreateAsync(seat);
        return _mapper.Map<SeatDto>(createdSeat);
    }

    public async Task<IEnumerable<SeatDto>> CreateBulkSeatsAsync(IEnumerable<CreateSeatDto> createSeatDtos)
    {
        var seats = createSeatDtos.Select(dto =>
        {
            var seat = _mapper.Map<Seat>(dto);
            seat.CreatedAt = DateTime.UtcNow;
            seat.Status = SeatStatus.Available;
            return seat;
        });

        var createdSeats = await _seatRepository.CreateBulkAsync(seats);
        return _mapper.Map<IEnumerable<SeatDto>>(createdSeats);
    }
}

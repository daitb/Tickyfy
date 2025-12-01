using AutoMapper;
using Tickify.DTOs.SeatMap;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Interfaces.Repositories;

namespace Tickify.Services
{
    public interface ISeatMapService
    {
        Task<SeatMapResponseDto?> GetSeatMapByIdAsync(int id);
        Task<SeatMapResponseDto?> GetSeatMapByEventIdAsync(int eventId);
        Task<List<SeatMapResponseDto>> GetTemplatesAsync(); // Lấy seat map templates
        Task<List<SeatResponseDto>> GetEventSeatsAsync(int eventId); // Lấy danh sách seats cho event
        Task<SeatMapResponseDto> CreateSeatMapAsync(CreateSeatMapDto dto);
        Task<SeatMapResponseDto> UpdateSeatMapAsync(int id, UpdateSeatMapDto dto);
        Task<bool> DeleteSeatMapAsync(int id);
        Task<bool> ReserveSeatsAsync(List<int> seatIds);
        Task<bool> ReleaseSeatsAsync(List<int> seatIds);
    }

    public class SeatMapService : ISeatMapService
    {
        private readonly ISeatMapRepository _seatMapRepository;
        private readonly ISeatRepository _seatRepository;
        private readonly IMapper _mapper;

        public SeatMapService(
            ISeatMapRepository seatMapRepository,
            ISeatRepository seatRepository,
            IMapper mapper)
        {
            _seatMapRepository = seatMapRepository;
            _seatRepository = seatRepository;
            _mapper = mapper;
        }

        public async Task<SeatMapResponseDto?> GetSeatMapByIdAsync(int id)
        {
            var seatMap = await _seatMapRepository.GetByIdAsync(id);
            return seatMap != null ? _mapper.Map<SeatMapResponseDto>(seatMap) : null;
        }

        public async Task<SeatMapResponseDto?> GetSeatMapByEventIdAsync(int eventId)
        {
            var seatMap = await _seatMapRepository.GetByEventIdAsync(eventId);
            return seatMap != null ? _mapper.Map<SeatMapResponseDto>(seatMap) : null;
        }

        public async Task<List<SeatMapResponseDto>> GetTemplatesAsync()
        {
            var templates = await _seatMapRepository.GetTemplatesAsync();
            return _mapper.Map<List<SeatMapResponseDto>>(templates);
        }

        public async Task<List<SeatResponseDto>> GetEventSeatsAsync(int eventId)
        {
            // Lấy tất cả seats của event thông qua ticket types
            var seats = await _seatRepository.GetByEventIdAsync(eventId);
            var seatDtos = _mapper.Map<List<SeatResponseDto>>(seats);
            
            return seatDtos;
        }

        public async Task<SeatMapResponseDto> CreateSeatMapAsync(CreateSeatMapDto dto)
        {
            var seatMap = _mapper.Map<SeatMap>(dto);
            seatMap.CreatedAt = DateTime.UtcNow;
            
            var created = await _seatMapRepository.CreateAsync(seatMap);
            return _mapper.Map<SeatMapResponseDto>(created);
        }

        public async Task<SeatMapResponseDto> UpdateSeatMapAsync(int id, UpdateSeatMapDto dto)
        {
            var seatMap = await _seatMapRepository.GetByIdAsync(id);
            if (seatMap == null)
                throw new KeyNotFoundException($"SeatMap with ID {id} not found");

            // Update only non-null properties
            if (dto.Name != null) seatMap.Name = dto.Name;
            if (dto.Description != null) seatMap.Description = dto.Description;
            if (dto.TotalRows.HasValue) seatMap.TotalRows = dto.TotalRows.Value;
            if (dto.TotalColumns.HasValue) seatMap.TotalColumns = dto.TotalColumns.Value;
            if (dto.LayoutConfig != null) seatMap.LayoutConfig = dto.LayoutConfig;
            if (dto.IsActive.HasValue) seatMap.IsActive = dto.IsActive.Value;
            
            seatMap.UpdatedAt = DateTime.UtcNow;

            var updated = await _seatMapRepository.UpdateAsync(seatMap);
            return _mapper.Map<SeatMapResponseDto>(updated);
        }

        public async Task<bool> DeleteSeatMapAsync(int id)
        {
            return await _seatMapRepository.DeleteAsync(id);
        }

        public async Task<bool> ReserveSeatsAsync(List<int> seatIds)
        {
            return await _seatRepository.ReserveSeatsAsync(seatIds);
        }

        public async Task<bool> ReleaseSeatsAsync(List<int> seatIds)
        {
            return await _seatRepository.ReleaseSeatsAsync(seatIds);
        }
    }
}

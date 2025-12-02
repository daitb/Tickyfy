using AutoMapper;
using Tickify.DTOs.SeatMap;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Interfaces.Repositories;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

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
        private readonly Data.ApplicationDbContext _dbContext;

        public SeatMapService(
            ISeatMapRepository seatMapRepository,
            ISeatRepository seatRepository,
            IMapper mapper,
            Data.ApplicationDbContext dbContext)
        {
            _seatMapRepository = seatMapRepository;
            _seatRepository = seatRepository;
            _mapper = mapper;
            _dbContext = dbContext;
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
            
            // Parse layoutConfig and create zones and seats
            await CreateZonesAndSeatsFromLayoutAsync(created.Id, dto.LayoutConfig, dto.EventId);
            
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
            if (dto.LayoutConfig != null) 
            {
                seatMap.LayoutConfig = dto.LayoutConfig;
                
                // Delete old zones and seats, then recreate from new layoutConfig
                // First get zone IDs to delete associated seats
                var oldZoneIds = await _dbContext.SeatZones
                    .Where(z => z.SeatMapId == id)
                    .Select(z => z.Id)
                    .ToListAsync();
                
                // Delete seats in those zones
                var oldSeats = _dbContext.Seats.Where(s => oldZoneIds.Contains(s.SeatZoneId.Value));
                _dbContext.Seats.RemoveRange(oldSeats);
                
                // Delete zones
                var oldZones = _dbContext.SeatZones.Where(z => z.SeatMapId == id);
                _dbContext.SeatZones.RemoveRange(oldZones);
                
                await _dbContext.SaveChangesAsync();
                
                // Create new zones and seats
                await CreateZonesAndSeatsFromLayoutAsync(id, dto.LayoutConfig, seatMap.EventId);
            }
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

        private async Task CreateZonesAndSeatsFromLayoutAsync(int seatMapId, string layoutConfig, int eventId)
        {
            if (string.IsNullOrWhiteSpace(layoutConfig) || layoutConfig == "{}")
                return;

            try
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                
                var layout = JsonSerializer.Deserialize<LayoutData>(layoutConfig, options);
                if (layout == null || layout.Zones == null || layout.Seats == null)
                {
                    Console.WriteLine($"[SeatMapService] Failed to parse layoutConfig: {layoutConfig}");
                    return;
                }

                Console.WriteLine($"[SeatMapService] Parsed {layout.Zones.Count} zones and {layout.Seats.Count} seats from layoutConfig");

                // Get event's ticket types for zone mapping
                var eventTicketTypes = await _dbContext.TicketTypes
                    .Where(tt => tt.EventId == eventId)
                    .ToListAsync();

                // Create zones
                var zoneIdMap = new Dictionary<string, int>(); // Maps frontend zoneId to DB ticketTypeId

                foreach (var zone in layout.Zones)
                {
                    // Try to find matching ticket type by price or create new one
                    var ticketType = eventTicketTypes.FirstOrDefault(tt => tt.Price == zone.Price);
                    
                    if (ticketType == null)
                    {
                        // Create new ticket type
                        ticketType = new TicketType
                        {
                            EventId = eventId,
                            Name = zone.Name,
                            Price = zone.Price,
                            TotalQuantity = zone.Capacity,
                            AvailableQuantity = zone.Capacity,
                            Description = $"Auto-created for zone {zone.Name}",
                            HasSeatSelection = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _dbContext.TicketTypes.Add(ticketType);
                        await _dbContext.SaveChangesAsync();
                    }

                    zoneIdMap[zone.Id] = ticketType.Id;

                    // Create seat zone
                    var seatZone = new SeatZone
                    {
                        SeatMapId = seatMapId,
                        TicketTypeId = ticketType.Id,
                        Name = zone.Name,
                        Color = zone.Color,
                        ZonePrice = zone.Price,
                        StartRow = 0,
                        EndRow = 0,
                        StartColumn = 0,
                        EndColumn = 0,
                        Capacity = zone.Capacity,
                        AvailableSeats = zone.Capacity,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.SeatZones.Add(seatZone);
                }

                await _dbContext.SaveChangesAsync();

                // Get created zones for seat assignment
                var createdZones = await _dbContext.SeatZones
                    .Where(z => z.SeatMapId == seatMapId)
                    .ToListAsync();

                // Create seats
                foreach (var seatData in layout.Seats)
                {
                    if (seatData.ZoneId == null)
                        continue;

                    var ticketTypeId = zoneIdMap.GetValueOrDefault(seatData.ZoneId);
                    if (ticketTypeId == 0)
                        continue;

                    var seatZone = createdZones.FirstOrDefault(z => z.TicketTypeId == ticketTypeId);
                    if (seatZone == null)
                        continue;

                    var seat = new Seat
                    {
                        TicketTypeId = ticketTypeId,
                        SeatZoneId = seatZone.Id,
                        Row = seatData.Row.ToString(),
                        SeatNumber = seatData.Col.ToString(),
                        GridRow = seatData.Row,
                        GridColumn = seatData.Col,
                        Status = SeatStatus.Available,
                        IsBlocked = seatData.IsBlocked,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.Seats.Add(seat);
                }

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error but don't throw - seat map creation should succeed even if zone/seat creation fails
                Console.WriteLine($"Error creating zones/seats from layout: {ex.Message}");
            }
        }

        // Helper classes for JSON deserialization
        private class LayoutData
        {
            public List<ZoneData> Zones { get; set; } = new();
            public List<SeatData> Seats { get; set; } = new();
        }

        private class ZoneData
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Color { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public int Capacity { get; set; }
        }

        private class SeatData
        {
            public string? Id { get; set; }
            public int Row { get; set; }
            public int Col { get; set; }
            public string? ZoneId { get; set; }
            public bool IsBlocked { get; set; }
            public bool IsWheelchair { get; set; }
            public string? Label { get; set; }
        }
    }
}

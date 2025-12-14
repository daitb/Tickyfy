using AutoMapper;
using Tickify.DTOs.SeatMap;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Interfaces.Repositories;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Tickify.Exceptions;

namespace Tickify.Services
{
    public interface ISeatMapService
    {
        Task<SeatMapResponseDto?> GetSeatMapByIdAsync(int id);
        Task<SeatMapResponseDto?> GetSeatMapByEventIdAsync(int eventId);
        Task<List<SeatMapResponseDto>> GetTemplatesAsync(); // Lấy seat map templates
        Task<List<SeatMapResponseDto>> GetSeatMapsByOrganizerAsync(int organizerId); // Lấy seat maps của organizer
        Task<List<SeatResponseDto>> GetEventSeatsAsync(int eventId); // Lấy danh sách seats cho event
        Task<SeatMapResponseDto> CreateSeatMapAsync(CreateSeatMapDto dto);
        Task<SeatMapResponseDto> UpdateSeatMapAsync(int id, UpdateSeatMapDto dto);
        Task<bool> DeleteSeatMapAsync(int id);
        Task<bool> ReserveSeatsAsync(List<int> seatIds, int userId);
        Task<bool> ReleaseSeatsAsync(List<int> seatIds, int userId);
        Task<int> ReleaseExpiredReservationsAsync();
        Task<bool> ExtendReservationAsync(List<int> seatIds, int userId);
        Task<bool> AdminLockSeatsAsync(List<int> seatIds, int adminId, string reason);
        Task<bool> AdminUnlockSeatsAsync(List<int> seatIds);
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

        public async Task<List<SeatMapResponseDto>> GetSeatMapsByOrganizerAsync(int organizerId)
        {
            // Get all events by this organizer
            var organizerEvents = await _dbContext.Events
                .Where(e => e.OrganizerId == organizerId)
                .Select(e => e.Id)
                .ToListAsync();

            // Get seat maps for these events
            var seatMaps = await _dbContext.SeatMaps
                .Include(sm => sm.Zones)
                .Include(sm => sm.Event)
                .Where(sm => organizerEvents.Contains(sm.EventId))
                .ToListAsync();

            var result = _mapper.Map<List<SeatMapResponseDto>>(seatMaps);
            
            // Add event title to each seat map for display
            foreach (var sm in result)
            {
                var evt = await _dbContext.Events.FindAsync(sm.EventId);
                if (evt != null)
                {
                    sm.Name = $"{evt.Title} - {sm.Name}";
                }
            }

            return result;
        }

        public async Task<List<SeatResponseDto>> GetEventSeatsAsync(int eventId)
        {
            try
            {
                // Lấy tất cả seats của event thông qua ticket types
                var seats = await _seatRepository.GetByEventIdAsync(eventId);
                
                if (seats == null || !seats.Any())
                {
                    Console.WriteLine($"[SeatMapService] GetEventSeatsAsync: No seats found for event {eventId}");
                    return new List<SeatResponseDto>();
                }
                
                Console.WriteLine($"[SeatMapService] GetEventSeatsAsync: Event {eventId}, Found {seats.Count()} seats");
                
                var seatDtos = _mapper.Map<List<SeatResponseDto>>(seats);
                
                // Validate mapping results
                var invalidSeats = seatDtos.Where(s => s.Id <= 0 || string.IsNullOrEmpty(s.Row)).ToList();
                if (invalidSeats.Any())
                {
                    Console.WriteLine($"[SeatMapService] WARNING: Found {invalidSeats.Count} invalid seats after mapping");
                }
                
                return seatDtos;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SeatMapService] GetEventSeatsAsync error for event {eventId}: {ex.Message}");
                Console.WriteLine($"[SeatMapService] Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<SeatMapResponseDto> CreateSeatMapAsync(CreateSeatMapDto dto)
        {
            var seatMap = _mapper.Map<SeatMap>(dto);
            seatMap.CreatedAt = DateTime.UtcNow;
            
            var created = await _seatMapRepository.CreateAsync(seatMap);
            
            // Parse layoutConfig and create zones and seats
            await CreateZonesAndSeatsFromLayoutAsync(created.Id, dto.LayoutConfig, dto.EventId);
            
            // Reload seat map to include newly created zones
            var reloaded = await _dbContext.SeatMaps
                .Include(sm => sm.Zones)
                .FirstOrDefaultAsync(sm => sm.Id == created.Id);
            
            return _mapper.Map<SeatMapResponseDto>(reloaded ?? created);
        }

        public async Task<SeatMapResponseDto> UpdateSeatMapAsync(int id, UpdateSeatMapDto dto)
        {
            var seatMap = await _seatMapRepository.GetByIdAsync(id);
            if (seatMap == null)
                throw new KeyNotFoundException($"SeatMap with ID {id} not found");

            // Use transaction to ensure atomicity - don't lose data if validation fails
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                // Update only non-null properties
                if (dto.Name != null) seatMap.Name = dto.Name;
                if (dto.Description != null) seatMap.Description = dto.Description;
                if (dto.TotalRows.HasValue) seatMap.TotalRows = dto.TotalRows.Value;
                if (dto.TotalColumns.HasValue) seatMap.TotalColumns = dto.TotalColumns.Value;
                if (dto.LayoutConfig != null) 
                {
                    // CRITICAL: Check if any tickets have been sold (Confirmed status) before allowing seat map changes
                    // Only check Confirmed bookings - Pending/Expired bookings haven't been paid yet
                    var hasTicketsSold = await _dbContext.Tickets
                        .AnyAsync(t => t.Booking != null && 
                                      t.Booking.EventId == seatMap.EventId &&
                                      t.Booking.Status == Tickify.Models.BookingStatus.Confirmed);
                    
                    if (hasTicketsSold)
                    {
                        throw new InvalidOperationException(
                            "Cannot modify seat map after tickets have been sold. " +
                            "This would affect existing bookings and seat assignments.");
                    }
                    
                    seatMap.LayoutConfig = dto.LayoutConfig;
                    
                    // Delete old zones and seats, then recreate from new layoutConfig
                    // First get zone IDs to delete associated seats
                    var oldZoneIds = await _dbContext.SeatZones
                        .Where(z => z.SeatMapId == id)
                        .Select(z => z.Id)
                        .ToListAsync();
                    
                    // Delete seats in those zones
                    var oldSeats = _dbContext.Seats.Where(s => s.SeatZoneId.HasValue && oldZoneIds.Contains(s.SeatZoneId.Value));
                    _dbContext.Seats.RemoveRange(oldSeats);
                    
                    // Delete zones
                    var oldZones = _dbContext.SeatZones.Where(z => z.SeatMapId == id);
                    _dbContext.SeatZones.RemoveRange(oldZones);
                    
                    await _dbContext.SaveChangesAsync();
                    
                    // Create new zones and seats - this will throw if validation fails
                    await CreateZonesAndSeatsFromLayoutAsync(id, dto.LayoutConfig, seatMap.EventId);
                }
                if (dto.IsActive.HasValue) seatMap.IsActive = dto.IsActive.Value;
                
                seatMap.UpdatedAt = DateTime.UtcNow;

                var updated = await _seatMapRepository.UpdateAsync(seatMap);
                
                // Commit transaction only if everything succeeded
                await transaction.CommitAsync();
                
                // Reload seat map to include newly created zones
                var reloaded = await _dbContext.SeatMaps
                    .Include(sm => sm.Zones)
                    .FirstOrDefaultAsync(sm => sm.Id == updated.Id);
                
                return _mapper.Map<SeatMapResponseDto>(reloaded ?? updated);
            }
            catch
            {
                // Rollback transaction on any error - old data will be preserved
                await transaction.RollbackAsync();
                throw; // Re-throw to let controller handle error response
            }
        }

        public async Task<bool> DeleteSeatMapAsync(int id)
        {
            return await _seatMapRepository.DeleteAsync(id);
        }

        public async Task<bool> ReserveSeatsAsync(List<int> seatIds, int userId)
        {
            return await _seatRepository.ReserveSeatsAsync(seatIds, userId);
        }

        public async Task<bool> ReleaseSeatsAsync(List<int> seatIds, int userId)
        {
            return await _seatRepository.ReleaseSeatsAsync(seatIds, userId);
        }

        public async Task<int> ReleaseExpiredReservationsAsync()
        {
            return await _seatRepository.ReleaseExpiredReservationsAsync();
        }
        
        public async Task<bool> ExtendReservationAsync(List<int> seatIds, int userId)
        {
            return await _seatRepository.ExtendReservationAsync(seatIds, userId);
        }
        
        public async Task<bool> AdminLockSeatsAsync(List<int> seatIds, int adminId, string reason)
        {
            return await _seatRepository.AdminLockSeatsAsync(seatIds, adminId, reason);
        }
        
        public async Task<bool> AdminUnlockSeatsAsync(List<int> seatIds)
        {
            return await _seatRepository.AdminUnlockSeatsAsync(seatIds);
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
                Console.WriteLine($"[SeatMapService] Zone names from layout: {string.Join(", ", layout.Zones.Select(z => $"'{z.Name}'"))}");

                // Get event's ticket types for zone mapping
                var eventTicketTypes = await _dbContext.TicketTypes
                    .Where(tt => tt.EventId == eventId)
                    .ToListAsync();

                Console.WriteLine($"[SeatMapService] Found {eventTicketTypes.Count} ticket types for event {eventId}");
                Console.WriteLine($"[SeatMapService] Ticket type names: {string.Join(", ", eventTicketTypes.Select(tt => $"'{tt.Name}'"))}");

                // AUTO-CREATE TICKET TYPES FROM ZONES (if no ticket types exist)
                if (eventTicketTypes.Count == 0 && layout.Zones.Any())
                {
                    Console.WriteLine($"[SeatMapService] No ticket types found. Auto-creating from zones...");
                    foreach (var zone in layout.Zones)
                    {
                        var newTicketType = new TicketType
                        {
                            EventId = eventId,
                            Name = zone.Name,
                            Price = zone.Price,
                            TotalQuantity = zone.Capacity,
                            AvailableQuantity = zone.Capacity,
                            HasSeatSelection = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _dbContext.TicketTypes.Add(newTicketType);
                        eventTicketTypes.Add(newTicketType);
                        Console.WriteLine($"[SeatMapService] ✅ Auto-created ticket type '{zone.Name}' from zone");
                    }
                    await _dbContext.SaveChangesAsync(); // Save to get IDs
                    
                    // Reload to get generated IDs
                    eventTicketTypes = await _dbContext.TicketTypes
                        .Where(tt => tt.EventId == eventId)
                        .ToListAsync();
                }
                else if (eventTicketTypes.Count == 0)
                {
                    Console.WriteLine($"[SeatMapService] ERROR: No ticket types and no zones provided.");
                    throw new BadRequestException("Cannot create seat map: No ticket types found and no zones provided.");
                }

                // AUTO-CREATE TICKET TYPES for zones that don't have matches
                var unmatchedZones = new List<(string Name, decimal Price, int Capacity)>();
                foreach (var zone in layout.Zones)
                {
                    var hasMatch = eventTicketTypes.Any(tt => 
                        tt.Name.Equals(zone.Name, StringComparison.OrdinalIgnoreCase));
                    
                    if (!hasMatch)
                    {
                        unmatchedZones.Add((zone.Name, zone.Price, zone.Capacity));
                    }
                }

                if (unmatchedZones.Any())
                {
                    Console.WriteLine($"[SeatMapService] Found {unmatchedZones.Count} zones without ticket types. Auto-creating...");
                    foreach (var (name, price, capacity) in unmatchedZones)
                    {
                        var newTicketType = new TicketType
                        {
                            EventId = eventId,
                            Name = name,
                            Price = price,
                            TotalQuantity = capacity,
                            AvailableQuantity = capacity,
                            HasSeatSelection = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _dbContext.TicketTypes.Add(newTicketType);
                        eventTicketTypes.Add(newTicketType);
                        Console.WriteLine($"[SeatMapService] ✅ Auto-created ticket type '{name}' from new zone");
                    }
                    await _dbContext.SaveChangesAsync(); // Save to get IDs
                    
                    // Reload to get generated IDs
                    eventTicketTypes = await _dbContext.TicketTypes
                        .Where(tt => tt.EventId == eventId)
                        .ToListAsync();
                }

                // Create zones (all zones are guaranteed to have matching ticket types)
                var zoneIdMap = new Dictionary<string, int>(); // Maps frontend zoneId to DB SeatZoneId
                var ticketTypeToZoneId = new Dictionary<int, int>(); // Maps ticketTypeId to SeatZoneId for seat creation

                foreach (var zone in layout.Zones)
                {
                    Console.WriteLine($"[SeatMapService] Processing zone: '{zone.Name}' (ID: '{zone.Id}', Price: {zone.Price}, Capacity: {zone.Capacity})");
                    
                    // Validate zone price
                    const decimal MAX_ZONE_PRICE = 50_000_000m; // 50 triệu VND
                    if (zone.Price > MAX_ZONE_PRICE)
                    {
                        throw new InvalidOperationException(
                            $"Zone '{zone.Name}' price ({zone.Price:N0} VND) exceeds maximum limit of {MAX_ZONE_PRICE:N0} VND. " +
                            $"This is due to payment gateway limitations (MoMo: 50M VND max per transaction).");
                    }
                    
                    // Find existing ticket type by name
                    var ticketType = eventTicketTypes.FirstOrDefault(tt => 
                        tt.Name.Equals(zone.Name, StringComparison.OrdinalIgnoreCase));
                    
                    if (ticketType == null)
                    {
                        Console.WriteLine($"[SeatMapService] ❌ ERROR: No ticket type found for zone '{zone.Name}' after auto-creation!");
                        Console.WriteLine($"[SeatMapService] Available ticket types: {string.Join(", ", eventTicketTypes.Select(tt => $"'{tt.Name}'"))}");
                        throw new InvalidOperationException($"Failed to find or create ticket type for zone '{zone.Name}'");
                    }
                    
                    // Update existing ticket type to match seat map configuration
                    ticketType.Price = zone.Price; // Update price from zone
                    ticketType.TotalQuantity = zone.Capacity; // Updated from actual seat count
                    ticketType.AvailableQuantity = zone.Capacity;
                    ticketType.HasSeatSelection = true;
                    _dbContext.TicketTypes.Update(ticketType);
                    
                    Console.WriteLine($"[SeatMapService] ✅ Matched zone '{zone.Name}' → ticket type '{ticketType.Name}' (ID: {ticketType.Id})");

                    // Create seat zone
                    var seatZone = new SeatZone
                    {
                        SeatMapId = seatMapId,
                        TicketTypeId = ticketType.Id,
                        Name = zone.Name,
                        Color = zone.Color,
                        ZonePrice = zone.Price,
                        StartRow = zone.StartRow,
                        EndRow = zone.EndRow,
                        StartColumn = zone.StartColumn,
                        EndColumn = zone.EndColumn,
                        Capacity = zone.Capacity,
                        AvailableSeats = zone.Capacity,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.SeatZones.Add(seatZone);
                    
                    // Save immediately to get SeatZone ID
                    await _dbContext.SaveChangesAsync();
                    
                    // Map frontend zone.Id → DB SeatZone.Id for seat assignment
                    zoneIdMap[zone.Id] = seatZone.Id;
                    ticketTypeToZoneId[ticketType.Id] = seatZone.Id;
                    
                    Console.WriteLine($"[SeatMapService] Created SeatZone (ID: {seatZone.Id}) for zone '{zone.Name}'");
                }

                Console.WriteLine($"[SeatMapService] All zones created successfully. Zone mapping: {string.Join(", ", zoneIdMap.Select(kvp => $"{kvp.Key}→{kvp.Value}"))}");

                // Validate zone overlaps (check if any zones have overlapping row/column ranges)
                var createdZones = await _dbContext.SeatZones
                    .Where(z => z.SeatMapId == seatMapId)
                    .ToListAsync();
                
                for (int i = 0; i < createdZones.Count; i++)
                {
                    for (int j = i + 1; j < createdZones.Count; j++)
                    {
                        var zone1 = createdZones[i];
                        var zone2 = createdZones[j];
                        
                        // Skip zones with zero ranges (dynamically positioned zones)
                        if (zone1.StartRow == 0 && zone1.EndRow == 0 && zone1.StartColumn == 0 && zone1.EndColumn == 0)
                            continue;
                        if (zone2.StartRow == 0 && zone2.EndRow == 0 && zone2.StartColumn == 0 && zone2.EndColumn == 0)
                            continue;
                        
                        // Check for overlap: zones overlap if their ranges intersect
                        bool rowsOverlap = zone1.StartRow <= zone2.EndRow && zone2.StartRow <= zone1.EndRow;
                        bool colsOverlap = zone1.StartColumn <= zone2.EndColumn && zone2.StartColumn <= zone1.EndColumn;
                        
                        if (rowsOverlap && colsOverlap)
                        {
                            throw new InvalidOperationException(
                                $"Zone overlap detected: Zone '{zone1.Name}' (rows {zone1.StartRow}-{zone1.EndRow}, cols {zone1.StartColumn}-{zone1.EndColumn}) " +
                                $"overlaps with zone '{zone2.Name}' (rows {zone2.StartRow}-{zone2.EndRow}, cols {zone2.StartColumn}-{zone2.EndColumn}).");
                        }
                    }
                }

                // Create seats using direct zone ID mapping
                var seatsCreated = 0;
                var seatsSkipped = 0;
                var missingZoneMappings = new List<string>();
                
                foreach (var seatData in layout.Seats)
                {
                    if (string.IsNullOrEmpty(seatData.ZoneId))
                    {
                        seatsSkipped++;
                        continue;
                    }

                    // Get SeatZone ID from mapping (frontend zoneId → DB SeatZone.Id)
                    if (!zoneIdMap.TryGetValue(seatData.ZoneId, out var seatZoneId))
                    {
                        if (!missingZoneMappings.Contains(seatData.ZoneId))
                        {
                            missingZoneMappings.Add(seatData.ZoneId);
                            Console.WriteLine($"[SeatMapService] ❌ WARNING: No zone mapping found for zoneId '{seatData.ZoneId}'. Available mappings: {string.Join(", ", zoneIdMap.Keys)}");
                        }
                        seatsSkipped++;
                        continue;
                    }
                    
                    // Get SeatZone to find TicketTypeId
                    var seatZone = await _dbContext.SeatZones.FindAsync(seatZoneId);
                    if (seatZone == null)
                    {
                        Console.WriteLine($"[SeatMapService] ERROR: SeatZone {seatZoneId} not found");
                        seatsSkipped++;
                        continue;
                    }

                    var seat = new Seat
                    {
                        TicketTypeId = seatZone.TicketTypeId,
                        SeatZoneId = seatZoneId,
                        Row = seatData.Row.ToString(),
                        SeatNumber = seatData.Col.ToString(),
                        GridRow = seatData.Row,
                        GridColumn = seatData.Col,
                        Status = SeatStatus.Available,
                        IsBlocked = seatData.IsBlocked,
                        IsWheelchair = seatData.IsWheelchair,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.Seats.Add(seat);
                    seatsCreated++;
                }

                await _dbContext.SaveChangesAsync();
                
                if (missingZoneMappings.Any())
                {
                    Console.WriteLine($"[SeatMapService] ⚠️ SUMMARY: {seatsCreated} seats created, {seatsSkipped} seats skipped due to missing zone mappings: {string.Join(", ", missingZoneMappings)}");
                }
                else
                {
                    Console.WriteLine($"[SeatMapService] ✅ SUCCESS: Created {seatsCreated} seats successfully (skipped {seatsSkipped} seats without zones)");
                }
            }
            catch (Exception ex)
            {
                // Log detailed error information
                Console.WriteLine($"[SeatMapService] ❌ ERROR creating zones/seats from layout: {ex.Message}");
                Console.WriteLine($"[SeatMapService] Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[SeatMapService] Inner exception: {ex.InnerException.Message}");
                }
                throw; // Re-throw to let caller know about the error
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
            public int StartRow { get; set; }
            public int EndRow { get; set; }
            public int StartColumn { get; set; }
            public int EndColumn { get; set; }
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

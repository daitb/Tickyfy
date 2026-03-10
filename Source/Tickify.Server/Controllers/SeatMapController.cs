using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.DTOs.SeatMap;
using Tickify.Services;

namespace Tickify.Controllers
{
    [ApiController]
    [Route("api/seatmaps")]
    public class SeatMapController : ControllerBase
    {
        private readonly ISeatMapService _seatMapService;

        public SeatMapController(ISeatMapService seatMapService)
        {
            _seatMapService = seatMapService;
        }

        
        /// Get seat map by ID

        [HttpGet("{id}")]
        public async Task<ActionResult<SeatMapResponseDto>> GetSeatMap(int id)
        {
            var seatMap = await _seatMapService.GetSeatMapByIdAsync(id);
            if (seatMap == null)
                return NotFound(new { message = "Seat map not found" });

            return Ok(seatMap);
        }

        
        /// Get seat map by event ID

        [HttpGet("event/{eventId}")]
        public async Task<ActionResult<SeatMapResponseDto>> GetSeatMapByEvent(int eventId)
        {
            var seatMap = await _seatMapService.GetSeatMapByEventIdAsync(eventId);
            if (seatMap == null)
                return NotFound(new { message = "Seat map not found for this event" });

            return Ok(seatMap);
        }

        
        /// Get seats with availability for an event (for customer booking)

        [HttpGet("event/{eventId}/seats")]
        public async Task<ActionResult<List<SeatResponseDto>>> GetEventSeats(int eventId)
        {
            try
            {
                var seats = await _seatMapService.GetEventSeatsAsync(eventId);
                return Ok(seats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi tải danh sách ghế: {ex.Message}" });
            }
        }

        
        /// Get all seat map templates (not assigned to any event) for organizers to choose from

        [HttpGet("templates")]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult<List<SeatMapResponseDto>>> GetTemplates()
        {
            var templates = await _seatMapService.GetTemplatesAsync();
            return Ok(templates);
        }

        
        /// Get all seat maps for organizer's events (for copying/reusing layouts)

        [HttpGet("organizer/{organizerId}")]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult<List<SeatMapResponseDto>>> GetOrganizerSeatMaps(int organizerId)
        {
            try
            {
                var seatMaps = await _seatMapService.GetSeatMapsByOrganizerAsync(organizerId);
                return Ok(seatMaps);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        
        /// Create a new seat map for an event (Organizer only)

        [HttpPost]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult<SeatMapResponseDto>> CreateSeatMap([FromBody] CreateSeatMapDto dto)
        {
            try
            {
                var seatMap = await _seatMapService.CreateSeatMapAsync(dto);
                return CreatedAtAction(nameof(GetSeatMap), new { id = seatMap.Id }, seatMap);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        
        /// Update seat map (Organizer only)

        [HttpPut("{id}")]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult<SeatMapResponseDto>> UpdateSeatMap(int id, [FromBody] UpdateSeatMapDto dto)
        {
            try
            {
                var updated = await _seatMapService.UpdateSeatMapAsync(id, dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Seat map not found" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        
        /// Delete seat map (Organizer/Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult> DeleteSeatMap(int id)
        {
            var success = await _seatMapService.DeleteSeatMapAsync(id);
            if (!success)
                return NotFound(new { message = "Seat map not found" });

            return NoContent();
        }

        
        /// Reserve seats (during checkout)
        [HttpPost("{seatMapId}/reserve")]
        [Authorize]
        public async Task<ActionResult> ReserveSeats(int seatMapId, [FromBody] List<int> seatIds)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (seatIds == null || !seatIds.Any())
                    return BadRequest(new { message = "Không có ghế nào được chọn." });

                var success = await _seatMapService.ReserveSeatsAsync(seatIds, userId);
                if (!success)
                {
                    return BadRequest(new { message = "Một hoặc nhiều ghế không khả dụng. Ghế có thể đã bị chặn, đã được người khác đặt giữ, hoặc không tồn tại." });
                }

                return Ok(new { message = "Seats reserved successfully", expiresIn = 15 * 60 });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        
        /// Release reserved seats (Customer: own seats only, Admin/Organizer: any seats)
        [HttpPost("{seatMapId}/release")]
        [Authorize]
        public async Task<ActionResult> ReleaseSeats(int seatMapId, [FromBody] List<int> seatIds)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user" });
                }

                var success = await _seatMapService.ReleaseSeatsAsync(seatIds, userId);
                return Ok(new { message = "Seats released successfully", success = success });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        
        /// Extend seat reservation by 5 minutes (can only be done once)
        [HttpPost("{seatMapId}/extend")]
        [Authorize]
        public async Task<ActionResult> ExtendReservation(int seatMapId, [FromBody] List<int> seatIds)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var success = await _seatMapService.ExtendReservationAsync(seatIds, userId);
                if (!success)
                    return BadRequest(new { message = "Unable to extend reservation. Either seats are not reserved by you or already extended" });

                return Ok(new { message = "Reservation extended by 5 minutes", additionalMinutes = 5 });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        
        /// Admin lock seats for VIP/sponsor
        [HttpPost("admin/lock-seats")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> AdminLockSeats([FromBody] AdminLockSeatsDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int adminId))
                    return Unauthorized(new { message = "Admin not authenticated" });

                var success = await _seatMapService.AdminLockSeatsAsync(dto.SeatIds, adminId, dto.Reason);
                if (!success)
                    return BadRequest(new { message = "Unable to lock seats. Seats may not be available" });

                return Ok(new { message = $"Successfully locked {dto.SeatIds.Count} seats", reason = dto.Reason });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        
        /// Admin unlock previously locked seats
        [HttpPost("admin/unlock-seats")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> AdminUnlockSeats([FromBody] List<int> seatIds)
        {
            try
            {
                var success = await _seatMapService.AdminUnlockSeatsAsync(seatIds);
                if (!success)
                    return BadRequest(new { message = "Unable to unlock seats. Seats may not be locked" });

                return Ok(new { message = $"Successfully unlocked {seatIds.Count} seats" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        
        /// Validate seat data for an event (for debugging)
        [HttpGet("event/{eventId}/validate")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> ValidateEventSeats(int eventId)
        {
            try
            {
                var seatMap = await _seatMapService.GetSeatMapByEventIdAsync(eventId);
                var seats = await _seatMapService.GetEventSeatsAsync(eventId);
                
                var validation = new
                {
                    eventId,
                    hasSeatMap = seatMap != null,
                    seatMapId = seatMap?.Id,
                    totalSeats = seats.Count,
                    availableSeats = seats.Count(s => s.Status.ToLower() == "available"),
                    reservedSeats = seats.Count(s => s.Status.ToLower() == "reserved"),
                    soldSeats = seats.Count(s => s.Status.ToLower() == "sold"),
                    blockedSeats = seats.Count(s => s.IsBlocked),
                    seatsWithZones = seats.Count(s => s.SeatZoneId != null),
                    seatsWithoutZones = seats.Count(s => s.SeatZoneId == null),
                    issues = new List<string>()
                };
                
                // Check for issues
                if (seatMap == null)
                {
                    validation.issues.Add("No seat map found for this event");
                }
                
                if (seats.Count == 0)
                {
                    validation.issues.Add("No seats found for this event");
                }
                
                var seatsWithoutTicketType = seats.Where(s => s.TicketTypeId <= 0).ToList();
                if (seatsWithoutTicketType.Any())
                {
                    validation.issues.Add($"{seatsWithoutTicketType.Count} seats missing ticket type");
                }
                
                return Ok(validation);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi validate: {ex.Message}" });
            }
        }
    }
}

public class AdminLockSeatsDto
{
    public List<int> SeatIds { get; set; } = new();
    public string Reason { get; set; } = string.Empty;
}

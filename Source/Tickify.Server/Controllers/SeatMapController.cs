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

        /// <summary>
        /// Get seat map by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<SeatMapResponseDto>> GetSeatMap(int id)
        {
            var seatMap = await _seatMapService.GetSeatMapByIdAsync(id);
            if (seatMap == null)
                return NotFound(new { message = "Seat map not found" });

            return Ok(seatMap);
        }

        /// <summary>
        /// Get seat map by event ID
        /// </summary>
        [HttpGet("event/{eventId}")]
        public async Task<ActionResult<SeatMapResponseDto>> GetSeatMapByEvent(int eventId)
        {
            var seatMap = await _seatMapService.GetSeatMapByEventIdAsync(eventId);
            if (seatMap == null)
                return NotFound(new { message = "Seat map not found for this event" });

            return Ok(seatMap);
        }

        /// <summary>
        /// Get seats with availability for an event (for customer booking)
        /// </summary>
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
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all seat map templates (not assigned to any event) for organizers to choose from
        /// </summary>
        [HttpGet("templates")]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult<List<SeatMapResponseDto>>> GetTemplates()
        {
            var templates = await _seatMapService.GetTemplatesAsync();
            return Ok(templates);
        }

        /// <summary>
        /// Get all seat maps for organizer's events (for copying/reusing layouts)
        /// </summary>
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

        /// <summary>
        /// Create a new seat map for an event (Organizer only)
        /// </summary>
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

        /// <summary>
        /// Update seat map (Organizer only)
        /// </summary>
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

        /// <summary>
        /// Delete seat map (Organizer/Admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult> DeleteSeatMap(int id)
        {
            var success = await _seatMapService.DeleteSeatMapAsync(id);
            if (!success)
                return NotFound(new { message = "Seat map not found" });

            return NoContent();
        }

        /// <summary>
        /// Reserve seats (during checkout)
        /// </summary>
        [HttpPost("{seatMapId}/reserve")]
        [Authorize]
        public async Task<ActionResult> ReserveSeats(int seatMapId, [FromBody] List<int> seatIds)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var success = await _seatMapService.ReserveSeatsAsync(seatIds, userId);
                if (!success)
                    return BadRequest(new { message = "One or more seats are not available" });

                return Ok(new { message = "Seats reserved successfully", expiresIn = 15 * 60 });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Release reserved seats (Customer: own seats only, Admin/Organizer: any seats)
        /// </summary>
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
        
        /// <summary>
        /// Extend seat reservation by 5 minutes (can only be done once)
        /// </summary>
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
        
        /// <summary>
        /// Admin lock seats for VIP/sponsor
        /// </summary>
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
        
        /// <summary>
        /// Admin unlock previously locked seats
        /// </summary>
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
    }
}

public class AdminLockSeatsDto
{
    public List<int> SeatIds { get; set; } = new();
    public string Reason { get; set; } = string.Empty;
}

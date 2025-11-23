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
                var success = await _seatMapService.ReserveSeatsAsync(seatIds);
                if (!success)
                    return BadRequest(new { message = "One or more seats are not available" });

                return Ok(new { message = "Seats reserved successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Release reserved seats (Admin/Organizer only)
        /// </summary>
        [HttpPost("{seatMapId}/release")]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<ActionResult> ReleaseSeats(int seatMapId, [FromBody] List<int> seatIds)
        {
            try
            {
                var success = await _seatMapService.ReleaseSeatsAsync(seatIds);
                return Ok(new { message = "Seats released successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

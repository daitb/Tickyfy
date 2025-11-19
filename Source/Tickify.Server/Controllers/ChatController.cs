using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Chat;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers
{
    /// <summary>
    /// Chat Controller - Manages real-time chat conversations between users and staff
    /// </summary>
    [ApiController]
    [Route("api/chat")]
    [Produces("application/json")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IChatService chatService,
            ILogger<ChatController> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/chat/conversations - Create a new chat conversation
        /// </summary>
        [HttpPost("conversations")]
        [ProducesResponseType(typeof(ApiResponse<ChatConversationDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<ChatConversationDto>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<ChatConversationDto>>> CreateConversation(
            [FromBody] CreateChatConversationDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse<ChatConversationDto>.FailureResponse(
                    "Validation failed",
                    errors
                ));
            }

            var userId = GetUserIdFromClaims();
            _logger.LogInformation("User {UserId} creating chat conversation", userId);

            var conversation = await _chatService.CreateConversationAsync(userId, dto);

            return CreatedAtAction(
                nameof(GetConversationDetail),
                new { id = conversation.Id },
                ApiResponse<ChatConversationDto>.SuccessResponse(
                    conversation,
                    "Chat conversation created successfully"
                )
            );
        }

        /// <summary>
        /// GET /api/chat/conversations - Get all conversations for the current user
        /// </summary>
        [HttpGet("conversations")]
        [ProducesResponseType(typeof(ApiResponse<List<ChatConversationDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<List<ChatConversationDto>>>> GetConversations()
        {
            var userId = GetUserIdFromClaims();
            var isStaff = IsStaff();

            _logger.LogInformation("Fetching conversations for user {UserId} (Staff: {IsStaff})", userId, isStaff);

            List<ChatConversationDto> conversations;

            if (isStaff)
            {
                // Pass null to get all conversations (assigned + unassigned)
                // Staff can see all conversations and pick up unassigned ones
                conversations = await _chatService.GetStaffConversationsAsync(null);
            }
            else
            {
                conversations = await _chatService.GetUserConversationsAsync(userId);
            }

            return Ok(ApiResponse<List<ChatConversationDto>>.SuccessResponse(
                conversations,
                $"Retrieved {conversations.Count} conversations"
            ));
        }

        /// <summary>
        /// GET /api/chat/conversations/{id} - Get conversation details with messages
        /// </summary>
        [HttpGet("conversations/{id}")]
        [ProducesResponseType(typeof(ApiResponse<ChatConversationDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ChatConversationDetailDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<ChatConversationDetailDto>>> GetConversationDetail(int id)
        {
            var userId = GetUserIdFromClaims();
            var isStaff = IsStaff();

            _logger.LogInformation("Fetching conversation {ConversationId} for user {UserId}", id, userId);

            try
            {
                var conversation = await _chatService.GetConversationDetailAsync(id, userId, isStaff);

                return Ok(ApiResponse<ChatConversationDetailDto>.SuccessResponse(
                    conversation,
                    "Conversation details retrieved successfully"
                ));
            }
            catch (Tickify.Exceptions.NotFoundException ex)
            {
                return NotFound(ApiResponse<ChatConversationDetailDto>.FailureResponse(ex.Message));
            }
            catch (Tickify.Exceptions.ForbiddenException ex)
            {
                return StatusCode(403, ApiResponse<ChatConversationDetailDto>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// POST /api/chat/conversations/{id}/assign - Assign conversation to staff (Admin/Staff only)
        /// </summary>
        [HttpPost("conversations/{id}/assign")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> AssignConversation(int id, [FromBody] AssignConversationRequest request)
        {
            var staffId = GetUserIdFromClaims();

            _logger.LogInformation("Assigning conversation {ConversationId} to staff {StaffId}", id, staffId);

            try
            {
                await _chatService.AssignConversationToStaffAsync(id, request.StaffId ?? staffId);

            return Ok(ApiResponse<object?>.SuccessResponse(
                null,
                "Conversation assigned successfully"
            ));
            }
            catch (Tickify.Exceptions.NotFoundException ex)
            {
                return NotFound(ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// POST /api/chat/conversations/{id}/status - Update conversation status
        /// </summary>
        [HttpPost("conversations/{id}/status")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<object>>> UpdateConversationStatus(
            int id,
            [FromBody] UpdateStatusRequest request)
        {
            var userId = GetUserIdFromClaims();
            var isStaff = IsStaff();

            _logger.LogInformation("Updating conversation {ConversationId} status to {Status}", id, request.Status);

            try
            {
                await _chatService.UpdateConversationStatusAsync(id, request.Status, userId, isStaff);

                return Ok(ApiResponse<object?>.SuccessResponse(
                    null,
                    "Conversation status updated successfully"
                ));
            }
            catch (Tickify.Exceptions.NotFoundException ex)
            {
                return NotFound(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Tickify.Exceptions.ForbiddenException ex)
            {
                return StatusCode(403, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// POST /api/chat/conversations/{id}/read - Mark messages as read
        /// </summary>
        [HttpPost("conversations/{id}/read")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
        {
            var userId = GetUserIdFromClaims();

            _logger.LogInformation("Marking messages as read in conversation {ConversationId} for user {UserId}", id, userId);

            await _chatService.MarkMessagesAsReadAsync(id, userId);

            return Ok(ApiResponse<object?>.SuccessResponse(
                null,
                "Messages marked as read"
            ));
        }

        #region Helper Methods

        private int GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }

            return userId;
        }

        private bool IsStaff()
        {
            return User.IsInRole("Admin") || User.IsInRole("Staff");
        }

        #endregion
    }

    /// <summary>
    /// Request model for assigning conversation to staff
    /// </summary>
    public class AssignConversationRequest
    {
        public int? StaffId { get; set; }
    }

    /// <summary>
    /// Request model for updating conversation status
    /// </summary>
    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}


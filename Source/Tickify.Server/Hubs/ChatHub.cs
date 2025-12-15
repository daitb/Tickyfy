using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Tickify.DTOs.Chat;
using Tickify.Interfaces.Services;

namespace Tickify.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var isStaff = IsStaff();

            // Add user to their personal group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            if (isStaff)
            {
                // Staff can join staff group to receive notifications
                await Groups.AddToGroupAsync(Context.ConnectionId, "staff");
                _logger.LogInformation("Staff {UserId} connected to chat hub", userId);
            }
            else
            {
                _logger.LogInformation("User {UserId} connected to chat hub", userId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} disconnected from chat hub", userId);
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a specific conversation room
        /// </summary>
        public async Task JoinConversation(int conversationId)
        {
            var userId = GetUserId();
            var isStaff = IsStaff();

            // Verify user has access to this conversation
            try
            {
                var conversation = await _chatService.GetConversationDetailAsync(conversationId, userId, isStaff);
                
                // Join the conversation room
                await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
                
                _logger.LogInformation("User {UserId} joined conversation {ConversationId}", userId, conversationId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "User {UserId} attempted to join conversation {ConversationId} without permission", userId, conversationId);
                await Clients.Caller.SendAsync("Error", "You don't have permission to access this conversation");
            }
        }

        /// <summary>
        /// Leave a conversation room
        /// </summary>
        public async Task LeaveConversation(int conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            _logger.LogInformation("User {UserId} left conversation {ConversationId}", GetUserId(), conversationId);
        }

        /// <summary>
        /// Send a message in a conversation
        /// </summary>
        public async Task SendMessage(SendMessageDto dto)
        {
            var userId = GetUserId();
            var isStaff = IsStaff();

            try
            {
                // Save message to database
                var message = await _chatService.SendMessageAsync(dto.ChatConversationId, userId, dto, isStaff);

                // Broadcast to all users in the conversation room
                await Clients.Group($"conversation_{dto.ChatConversationId}").SendAsync("ReceiveMessage", message);

                // If staff sent message, notify the user
                if (isStaff)
                {
                    await Clients.Group($"user_{message.SenderId}").SendAsync("NewMessage", message);
                }
                else
                {
                    // If user sent message, notify all staff
                    await Clients.Group("staff").SendAsync("NewMessage", message);
                }

                _logger.LogInformation("Message sent in conversation {ConversationId} by user {UserId}", dto.ChatConversationId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message in conversation {ConversationId}", dto.ChatConversationId);
                await Clients.Caller.SendAsync("Error", "Failed to send message");
            }
        }

        /// <summary>
        /// Mark messages as read
        /// </summary>
        public async Task MarkAsRead(int conversationId)
        {
            var userId = GetUserId();
            try
            {
                await _chatService.MarkMessagesAsReadAsync(conversationId, userId);
                
                // Notify other users in the conversation that messages were read
                await Clients.Group($"conversation_{conversationId}").SendAsync("MessagesRead", new { conversationId, userId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking messages as read in conversation {ConversationId}", conversationId);
            }
        }

        private int GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }

            return userId;
        }

        private bool IsStaff()
        {
            return Context.User?.IsInRole("Admin") == true || Context.User?.IsInRole("Staff") == true;
        }
    }
}


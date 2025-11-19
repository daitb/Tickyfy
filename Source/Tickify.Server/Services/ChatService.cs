using AutoMapper;
using Tickify.DTOs.Chat;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services
{
    public class ChatService : IChatService
    {
        private readonly IChatRepository _chatRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<ChatService> _logger;

        public ChatService(
            IChatRepository chatRepository,
            IUserRepository userRepository,
            IMapper mapper,
            ILogger<ChatService> logger)
        {
            _chatRepository = chatRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<ChatConversationDto> CreateConversationAsync(int userId, CreateChatConversationDto dto)
        {
            // Check if user already has an open conversation
            var existingConversation = await _chatRepository.GetChatConversationByUserIdAsync(userId);
            if (existingConversation != null && existingConversation.Status != "Closed")
            {
                // If there's an existing open conversation, add the message to it
                var message = new ChatMessage
                {
                    ChatConversationId = existingConversation.Id,
                    SenderId = userId,
                    Message = dto.InitialMessage,
                    IsStaffMessage = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _chatRepository.AddMessageAsync(message);
                await _chatRepository.SaveChangesAsync();

                return await MapToConversationDtoAsync(existingConversation, userId);
            }

            // Create new conversation
            var conversation = new ChatConversation
            {
                UserId = userId,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            await _chatRepository.CreateChatConversationAsync(conversation);
            await _chatRepository.SaveChangesAsync();

            // Add initial message
            var initialMessage = new ChatMessage
            {
                ChatConversationId = conversation.Id,
                SenderId = userId,
                Message = dto.InitialMessage,
                IsStaffMessage = false,
                CreatedAt = DateTime.UtcNow
            };

            await _chatRepository.AddMessageAsync(initialMessage);
            await _chatRepository.SaveChangesAsync();

            _logger.LogInformation("Created chat conversation {ConversationId} for user {UserId}", conversation.Id, userId);

            return await MapToConversationDtoAsync(conversation, userId);
        }

        public async Task<List<ChatConversationDto>> GetUserConversationsAsync(int userId)
        {
            var conversations = await _chatRepository.GetChatConversationsForUserAsync(userId);
            var result = new List<ChatConversationDto>();

            foreach (var conversation in conversations)
            {
                result.Add(await MapToConversationDtoAsync(conversation, userId));
            }

            return result;
        }

        public async Task<List<ChatConversationDto>> GetStaffConversationsAsync(int? staffId = null)
        {
            var conversations = await _chatRepository.GetChatConversationsForStaffAsync(staffId);
            var result = new List<ChatConversationDto>();

            foreach (var conversation in conversations)
            {
                // For staff, count unread messages from users (non-staff messages)
                // If staffId is null, we still count unread user messages for any staff
                var unreadCount = await _chatRepository.GetUnreadMessageCountForStaffAsync(conversation.Id);
                var dto = await MapToConversationDtoAsync(conversation, conversation.UserId);
                dto.UnreadCount = unreadCount;
                result.Add(dto);
            }

            return result;
        }

        public async Task<ChatConversationDetailDto> GetConversationDetailAsync(int conversationId, int userId, bool isStaff)
        {
            var conversation = await _chatRepository.GetChatConversationByIdAsync(conversationId);
            if (conversation == null)
            {
                throw new NotFoundException($"Chat conversation with ID {conversationId} not found");
            }

            // Check permissions
            if (!isStaff && conversation.UserId != userId)
            {
                throw new ForbiddenException("You don't have permission to access this conversation");
            }

            var messages = await _chatRepository.GetMessagesByConversationIdAsync(conversationId);

            var dto = new ChatConversationDetailDto
            {
                Id = conversation.Id,
                UserId = conversation.UserId,
                UserName = conversation.User.FullName,
                UserProfilePicture = conversation.User.ProfilePicture,
                UserEmail = conversation.User.Email,
                StaffId = conversation.StaffId,
                StaffName = conversation.Staff?.FullName,
                Status = conversation.Status,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
                Messages = messages.Select(m => new ChatMessageDto
                {
                    Id = m.Id,
                    ChatConversationId = m.ChatConversationId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.FullName,
                    SenderProfilePicture = m.Sender.ProfilePicture,
                    Message = m.Message,
                    IsStaffMessage = m.IsStaffMessage,
                    CreatedAt = m.CreatedAt,
                    IsRead = m.IsRead
                }).ToList()
            };

            // Mark messages as read if user is viewing
            if (isStaff || conversation.UserId == userId)
            {
                await _chatRepository.MarkMessagesAsReadAsync(conversationId, userId);
                await _chatRepository.SaveChangesAsync();
            }

            return dto;
        }

        public async Task<ChatMessageDto> SendMessageAsync(int conversationId, int senderId, SendMessageDto dto, bool isStaff)
        {
            var conversation = await _chatRepository.GetChatConversationByIdAsync(conversationId);
            if (conversation == null)
            {
                throw new NotFoundException($"Chat conversation with ID {conversationId} not found");
            }

            // Check permissions
            if (isStaff)
            {
                // Staff can send to any conversation
                if (conversation.StaffId == null)
                {
                    // Auto-assign to staff if not assigned
                    await _chatRepository.AssignConversationToStaffAsync(conversationId, senderId);
                }
            }
            else
            {
                // User can only send to their own conversation
                if (conversation.UserId != senderId)
                {
                    throw new ForbiddenException("You don't have permission to send messages to this conversation");
                }
            }

            var sender = await _userRepository.GetUserByIdAsync(senderId);
            if (sender == null)
            {
                throw new NotFoundException($"User with ID {senderId} not found");
            }

            var message = new ChatMessage
            {
                ChatConversationId = conversationId,
                SenderId = senderId,
                Message = dto.Message,
                IsStaffMessage = isStaff,
                CreatedAt = DateTime.UtcNow
            };

            await _chatRepository.AddMessageAsync(message);
            await _chatRepository.SaveChangesAsync();

            _logger.LogInformation("Message sent in conversation {ConversationId} by user {SenderId}", conversationId, senderId);

            return new ChatMessageDto
            {
                Id = message.Id,
                ChatConversationId = message.ChatConversationId,
                SenderId = message.SenderId,
                SenderName = sender.FullName,
                SenderProfilePicture = sender.ProfilePicture,
                Message = message.Message,
                IsStaffMessage = message.IsStaffMessage,
                CreatedAt = message.CreatedAt,
                IsRead = false
            };
        }

        public async Task AssignConversationToStaffAsync(int conversationId, int staffId)
        {
            var conversation = await _chatRepository.GetChatConversationByIdAsync(conversationId);
            if (conversation == null)
            {
                throw new NotFoundException($"Chat conversation with ID {conversationId} not found");
            }

            await _chatRepository.AssignConversationToStaffAsync(conversationId, staffId);
            await _chatRepository.SaveChangesAsync();

            _logger.LogInformation("Conversation {ConversationId} assigned to staff {StaffId}", conversationId, staffId);
        }

        public async Task UpdateConversationStatusAsync(int conversationId, string status, int userId, bool isStaff)
        {
            var conversation = await _chatRepository.GetChatConversationByIdAsync(conversationId);
            if (conversation == null)
            {
                throw new NotFoundException($"Chat conversation with ID {conversationId} not found");
            }

            // Check permissions
            if (!isStaff && conversation.UserId != userId)
            {
                throw new ForbiddenException("You don't have permission to update this conversation");
            }

            await _chatRepository.UpdateConversationStatusAsync(conversationId, status);
            await _chatRepository.SaveChangesAsync();

            _logger.LogInformation("Conversation {ConversationId} status updated to {Status}", conversationId, status);
        }

        public async Task MarkMessagesAsReadAsync(int conversationId, int userId)
        {
            await _chatRepository.MarkMessagesAsReadAsync(conversationId, userId);
            await _chatRepository.SaveChangesAsync();
        }

        private async Task<ChatConversationDto> MapToConversationDtoAsync(ChatConversation conversation, int userId)
        {
            var messages = await _chatRepository.GetMessagesByConversationIdAsync(conversation.Id, 0, 1);
            var lastMessage = messages.FirstOrDefault();

            var unreadCount = await _chatRepository.GetUnreadMessageCountAsync(conversation.Id, userId);

            return new ChatConversationDto
            {
                Id = conversation.Id,
                UserId = conversation.UserId,
                UserName = conversation.User.FullName,
                UserProfilePicture = conversation.User.ProfilePicture,
                StaffId = conversation.StaffId,
                StaffName = conversation.Staff?.FullName,
                Status = conversation.Status,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
                LastMessage = lastMessage != null ? new ChatMessageDto
                {
                    Id = lastMessage.Id,
                    ChatConversationId = lastMessage.ChatConversationId,
                    SenderId = lastMessage.SenderId,
                    SenderName = lastMessage.Sender.FullName,
                    SenderProfilePicture = lastMessage.Sender.ProfilePicture,
                    Message = lastMessage.Message,
                    IsStaffMessage = lastMessage.IsStaffMessage,
                    CreatedAt = lastMessage.CreatedAt,
                    IsRead = lastMessage.IsRead
                } : null,
                UnreadCount = unreadCount
            };
        }
    }
}


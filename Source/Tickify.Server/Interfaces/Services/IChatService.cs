using Tickify.DTOs.Chat;

namespace Tickify.Interfaces.Services
{
    public interface IChatService
    {
        Task<ChatConversationDto> CreateConversationAsync(int userId, CreateChatConversationDto dto);
        Task<List<ChatConversationDto>> GetUserConversationsAsync(int userId);
        Task<List<ChatConversationDto>> GetStaffConversationsAsync(int? staffId = null);
        Task<ChatConversationDetailDto> GetConversationDetailAsync(int conversationId, int userId, bool isStaff);
        Task<ChatMessageDto> SendMessageAsync(int conversationId, int senderId, SendMessageDto dto, bool isStaff);
        Task AssignConversationToStaffAsync(int conversationId, int staffId);
        Task UpdateConversationStatusAsync(int conversationId, string status, int userId, bool isStaff);
        Task MarkMessagesAsReadAsync(int conversationId, int userId);
    }
}


using Tickify.Models;

namespace Tickify.Interfaces.Repositories
{
    public interface IChatRepository
    {
        Task<ChatConversation?> GetChatConversationByIdAsync(int conversationId);
        Task<ChatConversation?> GetChatConversationByUserIdAsync(int userId);
        Task<List<ChatConversation>> GetChatConversationsForUserAsync(int userId);
        Task<List<ChatConversation>> GetChatConversationsForStaffAsync(int? staffId = null);
        Task<List<ChatConversation>> GetAllOpenConversationsAsync();
        Task<ChatConversation> CreateChatConversationAsync(ChatConversation conversation);
        Task<ChatMessage> AddMessageAsync(ChatMessage message);
        Task<List<ChatMessage>> GetMessagesByConversationIdAsync(int conversationId, int skip = 0, int take = 50);
        Task AssignConversationToStaffAsync(int conversationId, int staffId);
        Task UpdateConversationStatusAsync(int conversationId, string status);
        Task MarkMessagesAsReadAsync(int conversationId, int userId);
        Task<int> GetUnreadMessageCountAsync(int conversationId, int userId);
        Task<int> GetUnreadMessageCountForStaffAsync(int conversationId);
        Task SaveChangesAsync();
    }
}


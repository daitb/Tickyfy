using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories
{
    public class EfChatRepository : IChatRepository
    {
        private readonly ApplicationDbContext _context;

        public EfChatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ChatConversation?> GetChatConversationByIdAsync(int conversationId)
        {
            return await _context.ChatConversations
                .Include(c => c.User)
                .Include(c => c.Staff)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == conversationId);
        }

        public async Task<ChatConversation?> GetChatConversationByUserIdAsync(int userId)
        {
            return await _context.ChatConversations
                .Include(c => c.User)
                .Include(c => c.Staff)
                .Where(c => c.UserId == userId && c.Status != "Closed")
                .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<List<ChatConversation>> GetChatConversationsForUserAsync(int userId)
        {
            return await _context.ChatConversations
                .Include(c => c.User)
                .Include(c => c.Staff)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ChatConversation>> GetChatConversationsForStaffAsync(int? staffId = null)
        {
            var query = _context.ChatConversations
                .Include(c => c.User)
                .Include(c => c.Staff)
                .AsQueryable();

            if (staffId.HasValue)
            {
                // Get conversations assigned to this staff OR unassigned conversations (StaffId == null)
                // This allows staff to see and pick up new conversations
                query = query.Where(c => c.StaffId == staffId || c.StaffId == null);
            }
            else
            {
                // Get all open conversations (for admin or when no specific staff)
                query = query.Where(c => c.Status != "Closed");
            }

            return await query
                .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ChatConversation>> GetAllOpenConversationsAsync()
        {
            return await _context.ChatConversations
                .Include(c => c.User)
                .Include(c => c.Staff)
                .Where(c => c.Status != "Closed")
                .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
                .ToListAsync();
        }

        public async Task<ChatConversation> CreateChatConversationAsync(ChatConversation conversation)
        {
            await _context.ChatConversations.AddAsync(conversation);
            return conversation;
        }

        public async Task<ChatMessage> AddMessageAsync(ChatMessage message)
        {
            await _context.ChatMessages.AddAsync(message);
            
            // Update conversation's UpdatedAt
            var conversation = await _context.ChatConversations.FindAsync(message.ChatConversationId);
            if (conversation != null)
            {
                conversation.UpdatedAt = DateTime.UtcNow;
            }

            return message;
        }

        public async Task<List<ChatMessage>> GetMessagesByConversationIdAsync(int conversationId, int skip = 0, int take = 50)
        {
            return await _context.ChatMessages
                .Include(m => m.Sender)
                .Where(m => m.ChatConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Skip(skip)
                .Take(take)
                .OrderBy(m => m.CreatedAt) // Reverse order for display
                .ToListAsync();
        }

        public async Task AssignConversationToStaffAsync(int conversationId, int staffId)
        {
            var conversation = await _context.ChatConversations.FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.StaffId = staffId;
                conversation.Status = "InProgress";
                conversation.UpdatedAt = DateTime.UtcNow;
            }
        }

        public async Task UpdateConversationStatusAsync(int conversationId, string status)
        {
            var conversation = await _context.ChatConversations.FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.Status = status;
                conversation.UpdatedAt = DateTime.UtcNow;
                if (status == "Closed")
                {
                    conversation.ClosedAt = DateTime.UtcNow;
                }
            }
        }

        public async Task MarkMessagesAsReadAsync(int conversationId, int userId)
        {
            var messages = await _context.ChatMessages
                .Where(m => m.ChatConversationId == conversationId 
                    && m.SenderId != userId 
                    && !m.IsRead)
                .ToListAsync();

            foreach (var message in messages)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
            }
        }

        public async Task<int> GetUnreadMessageCountAsync(int conversationId, int userId)
        {
            return await _context.ChatMessages
                .CountAsync(m => m.ChatConversationId == conversationId 
                    && m.SenderId != userId 
                    && !m.IsRead);
        }

        public async Task<int> GetUnreadMessageCountForStaffAsync(int conversationId)
        {
            // Count unread messages from users (non-staff messages) in this conversation
            return await _context.ChatMessages
                .CountAsync(m => m.ChatConversationId == conversationId 
                    && !m.IsStaffMessage 
                    && !m.IsRead);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}


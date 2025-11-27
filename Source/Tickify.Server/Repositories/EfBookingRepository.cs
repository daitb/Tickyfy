// Repositories/EfBookingRepository.cs
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories
{
    public sealed class EfBookingRepository : IBookingRepository
    {
        private readonly ApplicationDbContext _db;
        public EfBookingRepository(ApplicationDbContext db) => _db = db;

        public Task<bool> ExistsAsync(int id)
            => _db.Bookings.AnyAsync(b => b.Id == id);

        public Task<Booking?> GetByIdAsync(int id)
            => _db.Bookings.FirstOrDefaultAsync(b => b.Id == id);

        public Task<Booking?> GetByBookingCodeAsync(string bookingCode)
            => _db.Bookings.FirstOrDefaultAsync(b => b.BookingCode == bookingCode); // nếu tên khác, đổi đúng property bạn đang dùng

        public async Task<IEnumerable<Booking>> GetByUserIdAsync(int userId)
            => await _db.Bookings.Where(b => b.UserId == userId).ToListAsync();

        public async Task<IEnumerable<Booking>> GetByEventIdAsync(int eventId)
            => await _db.Bookings.Where(b => b.EventId == eventId).ToListAsync();

        public async Task<Booking> CreateAsync(Booking booking)
        {
            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();
            return booking;
        }

        public async Task<Booking> UpdateAsync(Booking booking)
        {
            _db.Bookings.Update(booking);
            await _db.SaveChangesAsync();
            return booking;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id);
            if (entity == null) return false;
            _db.Bookings.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        public Task<int> CountByUserIdAsync(int userId)
            => _db.Bookings.CountAsync(b => b.UserId == userId);

        public async Task<IEnumerable<Booking>> GetExpiredBookingsAsync()
            => await _db.Bookings
                .Where(b => b.Status == BookingStatus.Pending && b.ExpiresAt != null && b.ExpiresAt < DateTime.UtcNow) 
                .ToListAsync();
    }
}


// do chua co chuc nang cua nhanh' khac 
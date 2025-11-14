using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Models;

namespace Tickify.Repositories
{
    public interface ISeatMapRepository
    {
        Task<SeatMap?> GetByIdAsync(int id);
        Task<SeatMap?> GetByEventIdAsync(int eventId);
        Task<List<SeatMap>> GetAllByEventIdAsync(int eventId);
        Task<SeatMap> CreateAsync(SeatMap seatMap);
        Task<SeatMap> UpdateAsync(SeatMap seatMap);
        Task<bool> DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
    }

    public class SeatMapRepository : ISeatMapRepository
    {
        private readonly ApplicationDbContext _context;

        public SeatMapRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SeatMap?> GetByIdAsync(int id)
        {
            return await _context.SeatMaps
                .Include(sm => sm.Zones)
                    .ThenInclude(z => z.TicketType)
                .FirstOrDefaultAsync(sm => sm.Id == id);
        }

        public async Task<SeatMap?> GetByEventIdAsync(int eventId)
        {
            return await _context.SeatMaps
                .Include(sm => sm.Zones)
                    .ThenInclude(z => z.TicketType)
                .Where(sm => sm.EventId == eventId && sm.IsActive)
                .FirstOrDefaultAsync();
        }

        public async Task<List<SeatMap>> GetAllByEventIdAsync(int eventId)
        {
            return await _context.SeatMaps
                .Include(sm => sm.Zones)
                    .ThenInclude(z => z.TicketType)
                .Where(sm => sm.EventId == eventId)
                .ToListAsync();
        }

        public async Task<SeatMap> CreateAsync(SeatMap seatMap)
        {
            _context.SeatMaps.Add(seatMap);
            await _context.SaveChangesAsync();
            return seatMap;
        }

        public async Task<SeatMap> UpdateAsync(SeatMap seatMap)
        {
            seatMap.UpdatedAt = DateTime.UtcNow;
            _context.SeatMaps.Update(seatMap);
            await _context.SaveChangesAsync();
            return seatMap;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var seatMap = await _context.SeatMaps.FindAsync(id);
            if (seatMap == null) return false;

            _context.SeatMaps.Remove(seatMap);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.SeatMaps.AnyAsync(sm => sm.Id == id);
        }
    }
}

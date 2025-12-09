using System.Threading;
using System.Threading.Tasks;
using Tickify.Models;
using Tickify.Interfaces.Repositories;

namespace Tickify.Extensions
{

    public static class BookingRepositoryExtensions
    {
        // Map về GetByIdAsync(id)
        public static Task<Booking?> GetAsync(this IBookingRepository repo, int id, CancellationToken _)
            => repo.GetByIdAsync(id);

        // Map về UpdateAsync(booking) – bỏ qua giá trị trả về
        public static async Task UpdateAsync(this IBookingRepository repo, Booking booking, CancellationToken _)
            => await repo.UpdateAsync(booking);
    }
}

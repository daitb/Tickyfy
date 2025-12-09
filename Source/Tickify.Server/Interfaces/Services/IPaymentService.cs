using Tickify.Models;

namespace Tickify.Interfaces.Services
{
    public interface IPaymentService
    {
        Task<Payment?> GetPaymentByIdAsync(int id);
        Task<Payment?> GetPaymentByBookingIdAsync(int bookingId);
        Task<Payment> ProcessPaymentAsync(Payment entity);
        Task<string> GenerateInvoiceAsync(int paymentId);
    }
}

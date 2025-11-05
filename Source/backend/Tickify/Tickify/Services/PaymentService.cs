using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;

        public PaymentService(IPaymentRepository paymentRepository)
        {
            _paymentRepository = paymentRepository;
        }

        public async Task<Payment?> GetPaymentByIdAsync(int id)
        {
            // TODO: Add business logic here
            return await _paymentRepository.GetByIdAsync(id);
        }

        public async Task<Payment?> GetPaymentByBookingIdAsync(int bookingId)
        {
            // TODO: Add business logic here
            return await _paymentRepository.GetByBookingIdAsync(bookingId);
        }

        public async Task<Payment> ProcessPaymentAsync(Payment entity)
        {
            // TODO: Add payment gateway integration logic here
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = PaymentStatus.Pending;
            return await _paymentRepository.AddAsync(entity);
        }

        public async Task<string> GenerateInvoiceAsync(int paymentId)
        {
            // TODO: Implement invoice generation logic
            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment != null)
            {
                // Generate invoice URL or PDF
                return $"/invoices/{paymentId}.pdf";
            }
            throw new Exception("Payment not found");
        }
    }
}

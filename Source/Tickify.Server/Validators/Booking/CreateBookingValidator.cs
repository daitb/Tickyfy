using FluentValidation;
using Tickify.DTOs.Booking;

namespace Tickify.Validators.Booking;


public class CreateBookingValidator : AbstractValidator<CreateBookingDto>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");

        RuleFor(x => x.TicketTypeId)
            .GreaterThan(0).WithMessage("TicketTypeId phải lớn hơn 0");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng phải lớn hơn 0")
            .LessThanOrEqualTo(50).WithMessage("Không được đặt quá 50 vé trong 1 lần");

        RuleFor(x => x.PromoCode)
            .MaximumLength(50).WithMessage("Mã giảm giá không được dài quá 50 ký tự")
            .When(x => !string.IsNullOrEmpty(x.PromoCode));

        RuleFor(x => x.SeatIds)
            .Must(seatIds => seatIds == null || seatIds.Count > 0)
            .WithMessage("Danh sách ghế không được rỗng nếu có chọn ghế")
            .Must((dto, seatIds) => seatIds == null || seatIds.Count == dto.Quantity)
            .WithMessage("Số lượng ghế phải khớp với số lượng vé");
    }
}

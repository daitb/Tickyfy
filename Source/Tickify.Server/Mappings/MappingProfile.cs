using AutoMapper;
using Tickify.DTOs.Auth;
using Tickify.DTOs.User;
using Tickify.DTOs.Role;
using Tickify.DTOs.Event;
using Tickify.DTOs.Category;
using Tickify.DTOs.Organizer;
using Tickify.DTOs.TicketType;
using Tickify.DTOs.Booking;
using Tickify.DTOs.Ticket;
using Tickify.DTOs.Seat;
using Tickify.DTOs.PromoCode;
using Tickify.DTOs.Payment;
using Tickify.DTOs.Review;
using Tickify.DTOs.Support;
using Tickify.DTOs.Notification;
using Tickify.DTOs.Refund;
using Tickify.DTOs.Waitlist;
using Tickify.DTOs.Wishlist;
using Tickify.DTOs.Payout;
using Tickify.DTOs.SeatMap;
using Tickify.Models;

namespace Tickify.Mappings;

/// <summary>
/// Cấu hình mapping giữa Models (database entities) và DTOs (data transfer objects)
/// AutoMapper sẽ tự động convert giữa 2 loại object này
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ============================================
        // USER & ROLE MAPPINGS
        // ============================================

        // User mappings
        CreateMap<User, UserDto>();
        CreateMap<User, UserDetailDto>();
        CreateMap<User, UserListDto>();
        CreateMap<User, UserProfileDto>();
        CreateMap<UpdateUserDto, User>();
        CreateMap<RegisterDto, User>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        // Role mappings
        CreateMap<Role, RoleDto>();
        CreateMap<CreateRoleDto, Role>();

        // ============================================
        // EVENT & CATEGORY MAPPINGS
        // ============================================

        // Event mappings
        CreateMap<Event, EventDetailDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.Organizer != null ? src.Organizer.CompanyName : string.Empty));
        CreateMap<Event, EventListDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty));
        CreateMap<Event, EventCardDto>();
        CreateMap<CreateEventDto, Event>();
        CreateMap<UpdateEventDto, Event>();

        // Category mappings
        CreateMap<Category, CategoryDto>();
        CreateMap<CreateCategoryDto, Category>();
        CreateMap<UpdateCategoryDto, Category>();

        // Organizer mappings
        CreateMap<Organizer, OrganizerDto>();
        CreateMap<Organizer, OrganizerProfileDto>();
        CreateMap<CreateOrganizerDto, Organizer>();

        // TicketType mappings
        CreateMap<TicketType, DTOs.TicketType.TicketTypeDto>();
        CreateMap<TicketType, TicketTypeDetailDto>();
        CreateMap<DTOs.TicketType.CreateTicketTypeDto, TicketType>();
        CreateMap<UpdateTicketTypeDto, TicketType>();

        // ============================================
        // BOOKING & TICKET MAPPINGS
        // ============================================

        // Booking mappings
        CreateMap<Booking, BookingDto>();
        CreateMap<Booking, BookingDetailDto>();
        CreateMap<Booking, BookingListDto>();
        CreateMap<Booking, BookingConfirmationDto>()
            .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.BookingNumber, opt => opt.MapFrom(src => src.BookingCode))
            .ForMember(dest => dest.EventTitle, opt => opt.MapFrom(src => src.Event != null ? src.Event.Title : string.Empty))
            .ForMember(dest => dest.EventStartDate, opt => opt.MapFrom(src => src.Event != null ? src.Event.StartDate : DateTime.MinValue))
            .ForMember(dest => dest.EventVenue, opt => opt.MapFrom(src => src.Event != null ? src.Event.Location : string.Empty))
            .ForMember(dest => dest.Quantity, opt => opt.MapFrom(src => src.Tickets != null ? src.Tickets.Count : 0))
            .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.TotalAmount))
            .ForMember(dest => dest.TicketNumbers, opt => opt.MapFrom(src => src.Tickets != null ? src.Tickets.Select(t => t.TicketCode).ToList() : new List<string>()))
            .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => src.Payment != null ? src.Payment.Status.ToString() : "Pending"))
            .ForMember(dest => dest.Message, opt => opt.MapFrom(src => "Booking created successfully. Please complete payment within 15 minutes."));
        CreateMap<CreateBookingDto, Booking>();

        // Ticket mappings
        CreateMap<Ticket, TicketDto>()
            .ForMember(dest => dest.SeatNumber, opt => opt.MapFrom(src => src.Seat != null ? src.Seat.SeatNumber : null));
        CreateMap<Ticket, TicketDetailDto>()
            .ForMember(dest => dest.TicketId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.TicketNumber, opt => opt.MapFrom(src => src.TicketCode))
            .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId))
            .ForMember(dest => dest.BookingNumber, opt => opt.MapFrom(src => src.Booking != null ? src.Booking.BookingCode : string.Empty))
            .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Booking != null && src.Booking.Event != null ? src.Booking.Event.Id : 0))
            .ForMember(dest => dest.EventTitle, opt => opt.MapFrom(src => src.Booking != null && src.Booking.Event != null ? src.Booking.Event.Title : string.Empty))
            .ForMember(dest => dest.EventVenue, opt => opt.MapFrom(src => src.Booking != null && src.Booking.Event != null ? src.Booking.Event.Location : string.Empty))
            .ForMember(dest => dest.EventStartDate, opt => opt.MapFrom(src => src.Booking != null && src.Booking.Event != null ? src.Booking.Event.StartDate : DateTime.MinValue))
            .ForMember(dest => dest.EventEndDate, opt => opt.MapFrom(src => src.Booking != null && src.Booking.Event != null ? src.Booking.Event.EndDate : DateTime.MinValue))
            .ForMember(dest => dest.TicketTypeName, opt => opt.MapFrom(src => src.TicketType != null ? src.TicketType.Name : string.Empty))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price))
            .ForMember(dest => dest.SeatId, opt => opt.MapFrom(src => src.SeatId))
            .ForMember(dest => dest.SeatNumber, opt => opt.MapFrom(src => src.Seat != null ? src.Seat.SeatNumber : (src.SeatNumber ?? null)))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.QrCode, opt => opt.MapFrom(src => src.TicketCode))
            .ForMember(dest => dest.IsUsed, opt => opt.MapFrom(src => src.Status == TicketStatus.Used))
            .ForMember(dest => dest.UsedAt, opt => opt.MapFrom(src => src.UsedAt))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt));

        // Seat mappings (original)
        CreateMap<Seat, DTOs.Seat.SeatDto>();
        CreateMap<DTOs.Seat.CreateSeatDto, Seat>();

        // Seat Management mappings (Week 2 - Seat Selection)
        CreateMap<SeatMap, SeatMapResponseDto>();
        CreateMap<CreateSeatMapDto, SeatMap>();
        CreateMap<UpdateSeatMapDto, SeatMap>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<SeatZone, SeatZoneResponseDto>();
        CreateMap<CreateSeatZoneDto, SeatZone>();
        CreateMap<CreateSeatZoneDto, SeatZone>();

        CreateMap<Seat, DTOs.SeatMap.SeatResponseDto>()
            .ForMember(dest => dest.FullSeatCode, opt => opt.MapFrom(src => $"{src.Row}{src.SeatNumber}"))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "Available")) // Default, will be overridden in AfterMap
            .ForMember(dest => dest.IsReserved, opt => opt.MapFrom(src => 
                src.ReservedByUserId.HasValue && 
                src.ReservedUntil.HasValue && 
                src.ReservedUntil.Value > DateTime.UtcNow))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => 
                src.SeatZone != null && src.SeatZone.ZonePrice > 0 
                    ? src.SeatZone.ZonePrice 
                    : (src.TicketType != null ? src.TicketType.Price : 0)))
            .ForMember(dest => dest.ZoneName, opt => opt.MapFrom(src => src.SeatZone != null ? src.SeatZone.Name : null))
            .ForMember(dest => dest.ZoneColor, opt => opt.MapFrom(src => src.SeatZone != null ? src.SeatZone.Color : null))
            .ForMember(dest => dest.IsWheelchair, opt => opt.MapFrom(src => src.IsWheelchair))
            .AfterMap((src, dest) =>
            {
                // Priority: Blocked > Sold > Reserved > Available
                if (src.IsBlocked)
                {
                    dest.Status = "Blocked";
                    return;
                }
                
                // Check if seat has valid tickets (sold)
                if (src.Tickets != null && src.Tickets.Any(t => t.Status == TicketStatus.Valid || t.Status == TicketStatus.Used))
                {
                    dest.Status = "Sold";
                    return;
                }
                
                // Check if seat is reserved (and reservation hasn't expired)
                if (src.ReservedByUserId.HasValue && src.ReservedUntil.HasValue && src.ReservedUntil.Value > DateTime.UtcNow)
                {
                    dest.Status = "Reserved";
                    return;
                }
                
                // Check seat status enum
                if (src.Status == SeatStatus.Sold)
                {
                    dest.Status = "Sold";
                    return;
                }
                if (src.Status == SeatStatus.Reserved)
                {
                    dest.Status = "Reserved";
                    return;
                }
                if (src.Status == SeatStatus.Blocked)
                {
                    dest.Status = "Blocked";
                    return;
                }
                
                // Default to Available (already set in MapFrom)
                dest.Status = "Available";
            });
        CreateMap<CreateSeatDto, Seat>();

        // PromoCode mappings
        CreateMap<PromoCode, PromoCodeDto>()
            .ForMember(dest => dest.PromoCodeId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CurrentUses, opt => opt.MapFrom(src => src.CurrentUses))
            .ForMember(dest => dest.ValidFrom, opt => opt.MapFrom(src => src.ValidFrom))
            .ForMember(dest => dest.ValidTo, opt => opt.MapFrom(src => src.ValidTo))
            // Legacy fields for backward compatibility
            .ForMember(dest => dest.DiscountType, opt => opt.MapFrom(src =>
                src.DiscountPercent.HasValue ? "Percentage" :
                src.DiscountAmount.HasValue ? "Fixed" : "Free"))
            .ForMember(dest => dest.DiscountValue, opt => opt.MapFrom(src =>
                src.DiscountPercent ?? src.DiscountAmount ?? 0))
            .ForMember(dest => dest.UsedCount, opt => opt.MapFrom(src => src.CurrentUses))
            .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => src.ValidFrom ?? src.CreatedAt))
            .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.ValidTo ?? DateTime.MaxValue));
        CreateMap<CreatePromoCodeDto, PromoCode>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentUses, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore());

        // ============================================
        // PAYMENT & REVIEW MAPPINGS
        // ============================================

        // Payment mappings
        CreateMap<Payment, PaymentDto>()
            .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.Method.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<Payment, PaymentDetailDto>()
            .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId))
            .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.Method.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<CreatePaymentDto, Payment>();

        // Review mappings
        CreateMap<Review, ReviewDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : "Unknown"))
            .ForMember(dest => dest.UserAvatar, opt => opt.MapFrom(src => src.User != null ? src.User.ProfilePicture : null))
            .ForMember(dest => dest.EventTitle, opt => opt.MapFrom(src => src.Event != null ? src.Event.Title : "Unknown Event"));
        CreateMap<Review, ReviewListDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : "Unknown"))
            .ForMember(dest => dest.UserAvatar, opt => opt.MapFrom(src => src.User != null ? src.User.ProfilePicture : null))
            .ForMember(dest => dest.EventTitle, opt => opt.MapFrom(src => src.Event != null ? src.Event.Title : "Unknown Event"));
        CreateMap<CreateReviewDto, Review>();
        CreateMap<UpdateReviewDto, Review>();

        // ============================================
        // SUPPORT & NOTIFICATION MAPPINGS
        // ============================================

        // Support mappings
        CreateMap<SupportTicket, SupportTicketDto>();
        CreateMap<SupportTicket, SupportTicketDetailDto>()
            .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => src.Messages));
        CreateMap<CreateSupportTicketDto, SupportTicket>();
        CreateMap<SupportMessage, SupportMessageDto>();

        // Notification mappings
        CreateMap<Notification, NotificationDto>()
           .ForMember(dest => dest.NotificationId, opt => opt.MapFrom(src => src.Id));
        CreateMap<CreateNotificationDto, Notification>();


        // ============================================
        // REFUND, WAITLIST, WISHLIST, PAYOUT MAPPINGS
        // ============================================

        // Refund mappings
        CreateMap<RefundRequest, RefundRequestDto>()
            .ForMember(dest => dest.RefundId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.BookingNumber, opt => opt.MapFrom(src => src.Booking != null ? src.Booking.BookingCode : string.Empty))
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : "Unknown"))
            .ForMember(dest => dest.EventTitle, opt => opt.MapFrom(src => src.Booking != null && src.Booking.Event != null ? src.Booking.Event.Title : "Unknown Event"))
            .ForMember(dest => dest.RequestedAt, opt => opt.MapFrom(src => src.CreatedAt));
        CreateMap<CreateRefundRequestDto, RefundRequest>();

        // Waitlist mappings
        CreateMap<Waitlist, WaitlistDto>();
        CreateMap<JoinWaitlistDto, Waitlist>();

        // Wishlist mappings
        CreateMap<Wishlist, WishlistDto>();

        // Payout mappings
        CreateMap<Payout, PayoutDto>()
            .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.Organizer != null ? src.Organizer.CompanyName : string.Empty));
        CreateMap<RequestPayoutDto, Payout>();
    }
}

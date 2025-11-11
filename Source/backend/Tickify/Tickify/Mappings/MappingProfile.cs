// using AutoMapper;
// using Tickify.DTOs.Auth;
// using Tickify.DTOs.User;
// using Tickify.DTOs.Role;
// using Tickify.DTOs.Event;
// using Tickify.DTOs.Category;
// using Tickify.DTOs.Organizer;
// using Tickify.DTOs.TicketType;
// using Tickify.DTOs.Booking;
// using Tickify.DTOs.Ticket;
// using Tickify.DTOs.Seat;
// using Tickify.DTOs.PromoCode;
// using Tickify.DTOs.Payment;
// using Tickify.DTOs.Review;
// using Tickify.DTOs.Support;
// using Tickify.DTOs.Notification;
// using Tickify.DTOs.Refund;
// using Tickify.DTOs.Waitlist;
// using Tickify.DTOs.Wishlist;
// using Tickify.DTOs.Payout;
// using Tickify.Models;

// namespace Tickify.Mappings;

// /// <summary>
// /// Cấu hình mapping giữa Models (database entities) và DTOs (data transfer objects)
// /// AutoMapper sẽ tự động convert giữa 2 loại object này
// /// </summary>
// public class MappingProfile : Profile
// {
//     public MappingProfile()
//     {
//         // ============================================
//         // USER & ROLE MAPPINGS
//         // ============================================
        
//         // User mappings
//         CreateMap<User, UserDto>();
//         CreateMap<User, UserDetailDto>();
//         CreateMap<User, UserListDto>();
//         CreateMap<User, UserProfileDto>();
//         CreateMap<UpdateUserDto, User>();
//         CreateMap<RegisterDto, User>()
//             .ForMember(dest => dest.Id, opt => opt.Ignore())
//             .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

//         // Role mappings
//         CreateMap<Role, RoleDto>();
//         CreateMap<CreateRoleDto, Role>();

//         // ============================================
//         // EVENT & CATEGORY MAPPINGS
//         // ============================================
        
//         // Event mappings
//         CreateMap<Event, EventDetailDto>()
//             .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
//             .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.Organizer != null ? src.Organizer.CompanyName : string.Empty));
//         CreateMap<Event, EventListDto>()
//             .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty));
//         CreateMap<Event, EventCardDto>();
//         CreateMap<CreateEventDto, Event>();
//         CreateMap<UpdateEventDto, Event>();

//         // Category mappings
//         CreateMap<Category, CategoryDto>();
//         CreateMap<CreateCategoryDto, Category>();
//         CreateMap<UpdateCategoryDto, Category>();

//         // Organizer mappings
//         CreateMap<Organizer, OrganizerDto>();
//         CreateMap<Organizer, OrganizerProfileDto>();
//         CreateMap<CreateOrganizerDto, Organizer>();

//         // TicketType mappings
//         CreateMap<TicketType, DTOs.TicketType.TicketTypeDto>();
//         CreateMap<TicketType, TicketTypeDetailDto>();
//         CreateMap<DTOs.TicketType.CreateTicketTypeDto, TicketType>();
//         CreateMap<UpdateTicketTypeDto, TicketType>();

//         // ============================================
//         // BOOKING & TICKET MAPPINGS
//         // ============================================
        
//         // Booking mappings
//         CreateMap<Booking, BookingDto>();
//         CreateMap<Booking, BookingDetailDto>();
//         CreateMap<Booking, BookingListDto>();
//         CreateMap<Booking, BookingConfirmationDto>();
//         CreateMap<CreateBookingDto, Booking>();

//         // Ticket mappings
//         CreateMap<Ticket, TicketDto>()
//             .ForMember(dest => dest.SeatNumber, opt => opt.MapFrom(src => src.Seat != null ? src.Seat.SeatNumber : null));
//         CreateMap<Ticket, TicketDetailDto>()
//             .ForMember(dest => dest.SeatNumber, opt => opt.MapFrom(src => src.Seat != null ? src.Seat.SeatNumber : null));

//         // Seat mappings
//         CreateMap<Seat, SeatDto>();
//         CreateMap<CreateSeatDto, Seat>();

//         // PromoCode mappings
//         CreateMap<PromoCode, PromoCodeDto>();

//         // ============================================
//         // PAYMENT & REVIEW MAPPINGS
//         // ============================================
        
//         // Payment mappings
//         CreateMap<Payment, PaymentDto>();
//         CreateMap<Payment, PaymentDetailDto>()
//             .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId));
//         CreateMap<CreatePaymentDto, Payment>();

//         // Review mappings
//         CreateMap<Review, ReviewDto>()
//             .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.FullName));
//         CreateMap<Review, ReviewListDto>()
//             .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.FullName));
//         CreateMap<CreateReviewDto, Review>();
//         CreateMap<UpdateReviewDto, Review>();

//         // ============================================
//         // SUPPORT & NOTIFICATION MAPPINGS
//         // ============================================
        
//         // Support mappings
//         CreateMap<SupportTicket, SupportTicketDto>();
//         CreateMap<SupportTicket, SupportTicketDetailDto>()
//             .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => src.Messages));
//         CreateMap<CreateSupportTicketDto, SupportTicket>();
//         CreateMap<SupportMessage, SupportMessageDto>();

//         // Notification mappings
//         CreateMap<Notification, NotificationDto>();
//         CreateMap<CreateNotificationDto, Notification>();

//         // ============================================
//         // REFUND, WAITLIST, WISHLIST, PAYOUT MAPPINGS
//         // ============================================
        
//         // Refund mappings
//         CreateMap<RefundRequest, RefundRequestDto>();
//         CreateMap<CreateRefundRequestDto, RefundRequest>();

//         // Waitlist mappings
//         CreateMap<Waitlist, WaitlistDto>();
//         CreateMap<JoinWaitlistDto, Waitlist>();

//         // Wishlist mappings
//         CreateMap<Wishlist, WishlistDto>();

//         // Payout mappings
//         CreateMap<Payout, PayoutDto>()
//             .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.Organizer != null ? src.Organizer.CompanyName : string.Empty));
//         CreateMap<RequestPayoutDto, Payout>();
//     }
// }

using Microsoft.EntityFrameworkCore;
using Tickify.Models;

namespace Tickify.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Organizer> Organizers { get; set; }
        public DbSet<TicketType> TicketTypes { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }
        public DbSet<SupportMessage> SupportMessages { get; set; }
        public DbSet<RefundRequest> RefundRequests { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<Payout> Payouts { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Seat> Seats { get; set; }
        public DbSet<SeatMap> SeatMaps { get; set; }
        public DbSet<SeatZone> SeatZones { get; set; }
        public DbSet<PromoCode> PromoCodes { get; set; }
        public DbSet<TicketScan> TicketScans { get; set; }
        public DbSet<Waitlist> Waitlists { get; set; }
        public DbSet<TicketTransfer> TicketTransfers { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<OrganizerRequest> OrganizerRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships and constraints here

            // User - Booking relationship
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User - Review relationship
            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User - Wishlist relationship
            modelBuilder.Entity<Wishlist>()
                .HasOne(w => w.User)
                .WithMany(u => u.Wishlists)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Organizer - User relationship (One-to-One)
            modelBuilder.Entity<Organizer>()
                .HasOne(o => o.User)
                .WithOne(u => u.OrganizerProfile)
                .HasForeignKey<Organizer>(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Organizer - VerifiedByStaff relationship (without navigation on User side)
            modelBuilder.Entity<Organizer>()
                .HasOne(o => o.VerifiedByStaff)
                .WithMany()
                .HasForeignKey(o => o.VerifiedByStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event - Organizer relationship
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Organizer)
                .WithMany(o => o.Events)
                .HasForeignKey(e => e.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event - Category relationship
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Category)
                .WithMany(c => c.Events)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event - ApprovedByStaff relationship (without navigation on User side)
            modelBuilder.Entity<Event>()
                .HasOne(e => e.ApprovedByStaff)
                .WithMany()
                .HasForeignKey(e => e.ApprovedByStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event - Review relationship
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Event)
                .WithMany(e => e.Reviews)
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event - Wishlist relationship
            modelBuilder.Entity<Wishlist>()
                .HasOne(w => w.Event)
                .WithMany(e => e.Wishlists)
                .HasForeignKey(w => w.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event - TicketType relationship
            modelBuilder.Entity<TicketType>()
                .HasOne(tt => tt.Event)
                .WithMany(e => e.TicketTypes)
                .HasForeignKey(tt => tt.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event - Booking relationship
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Event)
                .WithMany(e => e.Bookings)
                .HasForeignKey(b => b.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking - Payment relationship (One-to-One)
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Booking)
                .WithOne(b => b.Payment)
                .HasForeignKey<Payment>(p => p.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking - Ticket relationship
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Booking)
                .WithMany(b => b.Tickets)
                .HasForeignKey(t => t.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketType - Ticket relationship
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.TicketType)
                .WithMany(tt => tt.Tickets)
                .HasForeignKey(t => t.TicketTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seat - TicketType relationship
            modelBuilder.Entity<Seat>()
                .HasOne(s => s.TicketType)
                .WithMany(tt => tt.Seats)
                .HasForeignKey(s => s.TicketTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seat - Ticket relationship
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Seat)
                .WithMany(s => s.Tickets)
                .HasForeignKey(t => t.SeatId)
                .OnDelete(DeleteBehavior.Restrict);

            // User - Notification relationship
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // SupportTicket - User relationship (optional - can be guest)
            modelBuilder.Entity<SupportTicket>()
                .HasOne(st => st.User)
                .WithMany()
                .HasForeignKey(st => st.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // SupportTicket - AssignedToStaff relationship
            modelBuilder.Entity<SupportTicket>()
                .HasOne(st => st.AssignedToStaff)
                .WithMany()
                .HasForeignKey(st => st.AssignedToStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // SupportTicket - SupportMessage relationship
            modelBuilder.Entity<SupportMessage>()
                .HasOne(sm => sm.SupportTicket)
                .WithMany(st => st.Messages)
                .HasForeignKey(sm => sm.SupportTicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // RefundRequest - Booking relationship
            modelBuilder.Entity<RefundRequest>()
                .HasOne(rr => rr.Booking)
                .WithMany()
                .HasForeignKey(rr => rr.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            // RefundRequest - User relationship
            modelBuilder.Entity<RefundRequest>()
                .HasOne(rr => rr.User)
                .WithMany()
                .HasForeignKey(rr => rr.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // RefundRequest - ReviewedByStaff relationship
            modelBuilder.Entity<RefundRequest>()
                .HasOne(rr => rr.ReviewedByStaff)
                .WithMany()
                .HasForeignKey(rr => rr.ReviewedByStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // Payout - Organizer relationship
            modelBuilder.Entity<Payout>()
                .HasOne(p => p.Organizer)
                .WithMany()
                .HasForeignKey(p => p.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Payout - ProcessedByStaff relationship
            modelBuilder.Entity<Payout>()
                .HasOne(p => p.ProcessedByStaff)
                .WithMany()
                .HasForeignKey(p => p.ProcessedByStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // SystemSetting - UpdatedByUser relationship
            modelBuilder.Entity<SystemSetting>()
                .HasOne(ss => ss.UpdatedByUser)
                .WithMany()
                .HasForeignKey(ss => ss.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // UserRole - Composite Key and relationships
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // PromoCode - Event relationship (optional)
            modelBuilder.Entity<PromoCode>()
                .HasOne(pc => pc.Event)
                .WithMany()
                .HasForeignKey(pc => pc.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // PromoCode - Organizer relationship (optional)
            modelBuilder.Entity<PromoCode>()
                .HasOne(pc => pc.Organizer)
                .WithMany()
                .HasForeignKey(pc => pc.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);

            // PromoCode - CreatedByUser relationship
            modelBuilder.Entity<PromoCode>()
                .HasOne(pc => pc.CreatedByUser)
                .WithMany()
                .HasForeignKey(pc => pc.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking - PromoCode relationship (optional)
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.PromoCode)
                .WithMany(pc => pc.Bookings)
                .HasForeignKey(b => b.PromoCodeId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketScan - Ticket relationship
            modelBuilder.Entity<TicketScan>()
                .HasOne(ts => ts.Ticket)
                .WithMany()
                .HasForeignKey(ts => ts.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketScan - ScannedByUser relationship
            modelBuilder.Entity<TicketScan>()
                .HasOne(ts => ts.ScannedByUser)
                .WithMany()
                .HasForeignKey(ts => ts.ScannedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Waitlist - User relationship
            modelBuilder.Entity<Waitlist>()
                .HasOne(w => w.User)
                .WithMany()
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Waitlist - Event relationship
            modelBuilder.Entity<Waitlist>()
                .HasOne(w => w.Event)
                .WithMany()
                .HasForeignKey(w => w.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Waitlist - TicketType relationship (optional)
            modelBuilder.Entity<Waitlist>()
                .HasOne(w => w.TicketType)
                .WithMany()
                .HasForeignKey(w => w.TicketTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketTransfer - Ticket relationship
            modelBuilder.Entity<TicketTransfer>()
                .HasOne(tt => tt.Ticket)
                .WithMany()
                .HasForeignKey(tt => tt.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketTransfer - FromUser relationship
            modelBuilder.Entity<TicketTransfer>()
                .HasOne(tt => tt.FromUser)
                .WithMany()
                .HasForeignKey(tt => tt.FromUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketTransfer - ToUser relationship
            modelBuilder.Entity<TicketTransfer>()
                .HasOne(tt => tt.ToUser)
                .WithMany()
                .HasForeignKey(tt => tt.ToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketTransfer - ApprovedByUser relationship
            modelBuilder.Entity<TicketTransfer>()
                .HasOne(tt => tt.ApprovedByUser)
                .WithMany()
                .HasForeignKey(tt => tt.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add indexes for better performance

            // Unique indexes
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.BookingCode)
                .IsUnique();

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.TicketCode)
                .IsUnique();

            modelBuilder.Entity<PromoCode>()
                .HasIndex(pc => pc.Code)
                .IsUnique();

            // ===== CRITICAL PERFORMANCE INDEXES =====

            // Events - Most queried table
            modelBuilder.Entity<Event>()
                .HasIndex(e => e.Status);

            modelBuilder.Entity<Event>()
                .HasIndex(e => new { e.Status, e.StartDate }); // Composite for event listing

            modelBuilder.Entity<Event>()
                .HasIndex(e => e.CategoryId);

            modelBuilder.Entity<Event>()
                .HasIndex(e => e.OrganizerId);

            modelBuilder.Entity<Event>()
                .HasIndex(e => e.StartDate);

            // Bookings - High traffic
            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.UserId);

            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.EventId);

            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.Status);

            modelBuilder.Entity<Booking>()
                .HasIndex(b => new { b.Status, b.ExpiresAt }); // For expiration job

            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.BookingDate);

            // Tickets - Check-in and validation
            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.BookingId);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.TicketTypeId);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.SeatId);

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.Status);

            // Seats - Real-time availability
            modelBuilder.Entity<Seat>()
                .HasIndex(s => new { s.TicketTypeId, s.Status }); // Critical for seat selection!

            // Notifications - User inbox (shown on every page!)
            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead });

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.CreatedAt);

            // Waitlists - Queue processing
            modelBuilder.Entity<Waitlist>()
                .HasIndex(w => new { w.EventId, w.IsNotified, w.JoinedAt }); // FIFO queue

            modelBuilder.Entity<Waitlist>()
                .HasIndex(w => w.ExpiresAt);

            // PromoCodes - Validation
            modelBuilder.Entity<PromoCode>()
                .HasIndex(pc => pc.IsActive);

            modelBuilder.Entity<PromoCode>()
                .HasIndex(pc => new { pc.ValidFrom, pc.ValidTo });

            modelBuilder.Entity<PromoCode>()
                .HasIndex(pc => pc.EventId);

            // Payments - Financial queries
            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.Status);

            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.PaidAt);

            // Reviews - Rating calculations
            modelBuilder.Entity<Review>()
                .HasIndex(r => r.EventId);

            modelBuilder.Entity<Review>()
                .HasIndex(r => r.UserId);

            // SupportTickets - Dashboard
            modelBuilder.Entity<SupportTicket>()
                .HasIndex(st => new { st.Status, st.Priority }); // Staff dashboard query

            modelBuilder.Entity<SupportTicket>()
                .HasIndex(st => st.AssignedToStaffId);

            // TicketScans - Event day analytics
            modelBuilder.Entity<TicketScan>()
                .HasIndex(ts => ts.ScannedAt);

            // Users - Account management
            modelBuilder.Entity<User>()
                .HasIndex(u => u.IsActive);

            // RefundRequests - Processing
            modelBuilder.Entity<RefundRequest>()
                .HasIndex(rr => rr.Status);

            // Configure decimal precision for money fields
            modelBuilder.Entity<Booking>()
                .Property(b => b.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Booking>()
                .Property(b => b.DiscountAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payout>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.DiscountAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.DiscountPercent)
                .HasPrecision(5, 2);

            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.MinimumPurchase)
                .HasPrecision(18, 2);

            modelBuilder.Entity<RefundRequest>()
                .Property(rr => rr.RefundAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Ticket>()
                .Property(t => t.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<TicketType>()
                .Property(tt => tt.Price)
                .HasPrecision(18, 2);

            // ===== CHECK CONSTRAINTS FOR DATA VALIDATION =====

            // Events - Business rules
            modelBuilder.Entity<Event>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Events_MaxCapacity_Positive",
                    "[MaxCapacity] IS NULL OR [MaxCapacity] > 0"));

            modelBuilder.Entity<Event>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Events_MinimumAge_Valid",
                    "[MinimumAge] IS NULL OR ([MinimumAge] >= 0 AND [MinimumAge] <= 120)"));

            modelBuilder.Entity<Event>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Events_Dates_Valid",
                    "[EndDate] >= [StartDate]"));

            // TicketTypes - Inventory and pricing rules
            modelBuilder.Entity<TicketType>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_TicketTypes_TotalQuantity_Positive",
                    "[TotalQuantity] > 0"));

            modelBuilder.Entity<TicketType>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_TicketTypes_Available_LTE_Total",
                    "[AvailableQuantity] >= 0 AND [AvailableQuantity] <= [TotalQuantity]"));

            modelBuilder.Entity<TicketType>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_TicketTypes_Price_NonNegative",
                    "[Price] >= 0"));

            modelBuilder.Entity<TicketType>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_TicketTypes_SaleDates_Valid",
                    "[SaleEndDate] IS NULL OR [SaleStartDate] IS NULL OR [SaleEndDate] >= [SaleStartDate]"));

            // Bookings - Financial validation
            modelBuilder.Entity<Booking>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Bookings_TotalAmount_NonNegative",
                    "[TotalAmount] >= 0"));

            modelBuilder.Entity<Booking>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Bookings_Discount_LTE_Total",
                    "[DiscountAmount] >= 0 AND [DiscountAmount] <= [TotalAmount]"));

            modelBuilder.Entity<Booking>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Bookings_ExpiresAt_Future",
                    "[ExpiresAt] IS NULL OR [ExpiresAt] > [BookingDate]"));

            // Tickets - Pricing
            modelBuilder.Entity<Ticket>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Tickets_Price_NonNegative",
                    "[Price] >= 0"));

            // PromoCodes - Discount validation
            modelBuilder.Entity<PromoCode>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_PromoCodes_MaxUses_Positive",
                    "[MaxUses] IS NULL OR [MaxUses] > 0"));

            modelBuilder.Entity<PromoCode>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_PromoCodes_CurrentUses_Valid",
                    "[MaxUses] IS NULL OR [CurrentUses] <= [MaxUses]"));

            modelBuilder.Entity<PromoCode>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_PromoCodes_DiscountPercent_Valid",
                    "[DiscountPercent] IS NULL OR ([DiscountPercent] >= 0 AND [DiscountPercent] <= 100)"));

            modelBuilder.Entity<PromoCode>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_PromoCodes_DiscountAmount_NonNegative",
                    "[DiscountAmount] IS NULL OR [DiscountAmount] >= 0"));

            modelBuilder.Entity<PromoCode>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_PromoCodes_MinimumPurchase_NonNegative",
                    "[MinimumPurchase] IS NULL OR [MinimumPurchase] >= 0"));

            modelBuilder.Entity<PromoCode>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_PromoCodes_Dates_Valid",
                    "[ValidTo] >= [ValidFrom]"));

            // Reviews - Rating validation
            modelBuilder.Entity<Review>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Reviews_Rating_Valid",
                    "[Rating] >= 1 AND [Rating] <= 5"));

            // Payments - Financial validation
            modelBuilder.Entity<Payment>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Payments_Amount_Positive",
                    "[Amount] > 0"));

            // RefundRequests - Amount validation
            modelBuilder.Entity<RefundRequest>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_RefundRequests_Amount_Positive",
                    "[RefundAmount] > 0"));

            // Payouts - Amount validation
            modelBuilder.Entity<Payout>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Payouts_Amount_Positive",
                    "[Amount] > 0"));

            // Waitlists - Quantity validation
            modelBuilder.Entity<Waitlist>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Waitlists_Quantity_Positive",
                    "[RequestedQuantity] > 0"));

            // RefreshToken - User relationship
            modelBuilder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // RefreshToken - Index for faster lookups
            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token);

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => new { rt.UserId, rt.IsRevoked });

            // OrganizerRequest - Primary key
            modelBuilder.Entity<OrganizerRequest>()
                .HasKey(or => or.RequestId);

            // OrganizerRequest - User relationship
            modelBuilder.Entity<OrganizerRequest>()
                .HasOne(or => or.User)
                .WithMany()
                .HasForeignKey(or => or.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // OrganizerRequest - ReviewedByAdmin relationship
            modelBuilder.Entity<OrganizerRequest>()
                .HasOne(or => or.ReviewedByAdmin)
                .WithMany()
                .HasForeignKey(or => or.ReviewedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);

            // OrganizerRequest - Indexes
            modelBuilder.Entity<OrganizerRequest>()
                .HasIndex(or => or.UserId);

            modelBuilder.Entity<OrganizerRequest>()
                .HasIndex(or => or.Status);
        }
    }
}

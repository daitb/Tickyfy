using Microsoft.EntityFrameworkCore;
using Tickify.Models;

namespace Tickify.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            try
            {
                // Ensure database is created
                await context.Database.EnsureCreatedAsync();

                // Seed Roles
                if (!await context.Roles.AnyAsync())
                {
                    Console.WriteLine("Seeding Roles...");
                    var roles = new[]
                    {
                        new Role
                        {
                            Name = "Admin",
                            Description = "Full system administrator with all permissions",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Role
                        {
                            Name = "Staff",
                            Description = "Support staff - Handle customer support and ticket verification",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Role
                        {
                            Name = "Organizer",
                            Description = "Event organizer - Create and manage events",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Role
                        {
                            Name = "Customer",
                            Description = "Regular customer - Book tickets and attend events",
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    await context.Roles.AddRangeAsync(roles);
                    await context.SaveChangesAsync();
                    Console.WriteLine("✅ Roles seeded successfully!");
                }

                // Seed Categories
                if (!await context.Categories.AnyAsync())
                {
                    Console.WriteLine("Seeding Categories...");
                    var categories = new[]
                    {
                        new Category
                        {
                            Name = "Music & Concerts",
                            Description = "Live music performances, concerts, and music festivals",
                            IconUrl = "🎵",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category
                        {
                            Name = "Sports & Fitness",
                            Description = "Sports events, marathons, and fitness activities",
                            IconUrl = "⚽",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category
                        {
                            Name = "Business & Professional",
                            Description = "Conferences, seminars, workshops, and networking events",
                            IconUrl = "💼",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category
                        {
                            Name = "Technology & Innovation",
                            Description = "Tech conferences, hackathons, and startup events",
                            IconUrl = "💻",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category
                        {
                            Name = "Arts & Culture",
                            Description = "Art exhibitions, cultural festivals, and theater performances",
                            IconUrl = "🎨",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category
                        {
                            Name = "Food & Drink",
                            Description = "Food festivals, cooking classes, and culinary events",
                            IconUrl = "🍔",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category
                        {
                            Name = "Entertainment",
                            Description = "Comedy shows, movies, stand-up, and entertainment events",
                            IconUrl = "🎭",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Category
                        {
                            Name = "Education & Learning",
                            Description = "Educational workshops, training sessions, and academic events",
                            IconUrl = "📚",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    await context.Categories.AddRangeAsync(categories);
                    await context.SaveChangesAsync();
                    Console.WriteLine("✅ Categories seeded successfully!");
                }

                // Seed Admin User
                if (!await context.Users.AnyAsync())
                {
                    Console.WriteLine("Seeding Admin User...");

                    // Note: In production, use BCrypt or ASP.NET Core Identity for password hashing
                    var admin = new User
                    {
                        Email = "admin@tickify.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                        FullName = "System Administrator",
                        PhoneNumber = "+84123456789",
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Users.AddAsync(admin);
                    await context.SaveChangesAsync();

                    // Assign Admin role
                    var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");
                    var adminUserRole = new UserRole
                    {
                        UserId = admin.Id,
                        RoleId = adminRole.Id,
                        AssignedAt = DateTime.UtcNow
                    };

                    await context.UserRoles.AddAsync(adminUserRole);
                    await context.SaveChangesAsync();

                    Console.WriteLine("✅ Admin user created successfully!");
                    Console.WriteLine($"   Email: admin@tickify.com");
                    Console.WriteLine($"   Password: Admin@123456");
                }

                // Seed Sample Customer
                if (await context.Users.CountAsync() == 1)
                {
                    Console.WriteLine("Seeding Sample Customer...");

                    var customer = new User
                    {
                        Email = "customer@example.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                        FullName = "John Doe",
                        PhoneNumber = "+84987654321",
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Users.AddAsync(customer);
                    await context.SaveChangesAsync();

                    // Assign Customer role
                    var customerRole = await context.Roles.FirstAsync(r => r.Name == "Customer");
                    var customerUserRole = new UserRole
                    {
                        UserId = customer.Id,
                        RoleId = customerRole.Id,
                        AssignedAt = DateTime.UtcNow
                    };

                    await context.UserRoles.AddAsync(customerUserRole);
                    await context.SaveChangesAsync();

                    Console.WriteLine("✅ Sample customer created!");
                    Console.WriteLine($"   Email: customer@example.com");
                    Console.WriteLine($"   Password: Customer@123");
                }

                // Seed Sample Organizer
                if (await context.Users.CountAsync() == 2)
                {
                    Console.WriteLine("Seeding Sample Organizer...");

                    var organizerUser = new User
                    {
                        Email = "organizer@example.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Organizer@123"),
                        FullName = "Jane Smith",
                        PhoneNumber = "+84912345678",
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Users.AddAsync(organizerUser);
                    await context.SaveChangesAsync();

                    // Assign Organizer role
                    var organizerRole = await context.Roles.FirstAsync(r => r.Name == "Organizer");
                    var organizerUserRole = new UserRole
                    {
                        UserId = organizerUser.Id,
                        RoleId = organizerRole.Id,
                        AssignedAt = DateTime.UtcNow
                    };

                    await context.UserRoles.AddAsync(organizerUserRole);
                    await context.SaveChangesAsync();

                    Console.WriteLine("✅ Sample organizer created!");
                    Console.WriteLine($"   Email: organizer@example.com");
                    Console.WriteLine($"   Password: Organizer@123");
                }

                // Seed Sample Staff
                if (await context.Users.CountAsync() == 3)
                {
                    Console.WriteLine("Seeding Sample Staff...");

                    var staff = new User
                    {
                        Email = "staff@example.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
                        FullName = "Bob Johnson",
                        PhoneNumber = "+84987651234",
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Users.AddAsync(staff);
                    await context.SaveChangesAsync();

                    // Assign Staff role
                    var staffRole = await context.Roles.FirstAsync(r => r.Name == "Staff");
                    var staffUserRole = new UserRole
                    {
                        UserId = staff.Id,
                        RoleId = staffRole.Id,
                        AssignedAt = DateTime.UtcNow
                    };

                    await context.UserRoles.AddAsync(staffUserRole);
                    await context.SaveChangesAsync();

                    Console.WriteLine("✅ Sample staff created!");
                    Console.WriteLine($"   Email: staff@example.com");
                    Console.WriteLine($"   Password: Staff@123");
                }

                // Seed Sample Organizer Profile
                var existingOrganizerUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "organizer@example.com");
                if (existingOrganizerUser != null && !await context.Organizers.AnyAsync())
                {
                    Console.WriteLine("Seeding Organizer Profile...");
                    
                    var organizerProfile = new Organizer
                    {
                        UserId = existingOrganizerUser.Id,
                        CompanyName = "Tech Events Vietnam",
                        CompanyEmail = "contact@techevents.vn",
                        CompanyPhone = "+84912345678",
                        CompanyAddress = "123 Nguyen Hue, District 1, Ho Chi Minh City",
                        Description = "Leading event organizer in Vietnam, specializing in tech conferences and music festivals",
                        Website = "https://techevents.vn",
                        IsVerified = true,
                        VerifiedAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Organizers.AddAsync(organizerProfile);
                    await context.SaveChangesAsync();
                    Console.WriteLine("✅ Organizer profile created!");
                }

                // Seed Sample Events
                var organizer = await context.Organizers.Include(o => o.User).FirstOrDefaultAsync();
                if (organizer != null && !await context.Events.AnyAsync())
                {
                    Console.WriteLine("Seeding Sample Events...");

                    var musicCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Music & Concerts");
                    var techCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Technology & Innovation");
                    var sportsCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Sports & Fitness");

                    if (musicCategory == null || techCategory == null || sportsCategory == null)
                    {
                        Console.WriteLine("⚠️ Required categories not found. Skipping event seeding.");
                        Console.WriteLine($"   Music Category: {(musicCategory != null ? "✓" : "✗")}");
                        Console.WriteLine($"   Tech Category: {(techCategory != null ? "✓" : "✗")}");
                        Console.WriteLine($"   Sports Category: {(sportsCategory != null ? "✓" : "✗")}");
                        return;
                    }

                    var events = new[]
                    {
                        new Event
                        {
                            Title = "Summer Music Festival 2025",
                            Description = "Join us for the biggest summer music festival featuring top Vietnamese and international artists!",
                            StartDate = DateTime.UtcNow.AddDays(30),
                            EndDate = DateTime.UtcNow.AddDays(32),
                            Location = "Ho Chi Minh City",
                            Address = "Saigon Exhibition and Convention Center (SECC), District 7",
                            MaxCapacity = 5000,
                            CategoryId = musicCategory.Id,
                            OrganizerId = organizer.Id,
                            Status = EventStatus.Published,
                            BannerImage = "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
                            PosterImage = "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400",
                            CreatedAt = DateTime.UtcNow,
                            ApprovedAt = DateTime.UtcNow
                        },
                        new Event
                        {
                            Title = "Tech Innovation Summit 2025",
                            Description = "Explore the latest trends in AI, blockchain, and cloud computing with industry leaders",
                            StartDate = DateTime.UtcNow.AddDays(45),
                            EndDate = DateTime.UtcNow.AddDays(46),
                            Location = "Hanoi",
                            Address = "National Convention Center, Me Tri, Tu Liem, Hanoi",
                            MaxCapacity = 2000,
                            CategoryId = techCategory.Id,
                            OrganizerId = organizer.Id,
                            Status = EventStatus.Published,
                            BannerImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                            PosterImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
                            CreatedAt = DateTime.UtcNow,
                            ApprovedAt = DateTime.UtcNow
                        },
                        new Event
                        {
                            Title = "Vietnam Marathon 2025",
                            Description = "Annual marathon event with 5K, 10K, and full marathon distances",
                            StartDate = DateTime.UtcNow.AddDays(60),
                            EndDate = DateTime.UtcNow.AddDays(60),
                            Location = "Da Nang",
                            Address = "Dragon Bridge, Da Nang City",
                            MaxCapacity = 10000,
                            CategoryId = sportsCategory.Id,
                            OrganizerId = organizer.Id,
                            Status = EventStatus.Published,
                            BannerImage = "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800",
                            PosterImage = "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=400",
                            CreatedAt = DateTime.UtcNow,
                            ApprovedAt = DateTime.UtcNow
                        },
                        new Event
                        {
                            Title = "Jazz Night Under the Stars",
                            Description = "An intimate evening of live jazz music in a beautiful outdoor setting",
                            StartDate = DateTime.UtcNow.AddDays(20),
                            EndDate = DateTime.UtcNow.AddDays(20),
                            Location = "Ho Chi Minh City",
                            Address = "Landmark 81 Sky View, District 1",
                            MaxCapacity = 500,
                            CategoryId = musicCategory.Id,
                            OrganizerId = organizer.Id,
                            Status = EventStatus.Published,
                            BannerImage = "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800",
                            PosterImage = "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400",
                            CreatedAt = DateTime.UtcNow,
                            ApprovedAt = DateTime.UtcNow
                        },
                        new Event
                        {
                            Title = "Startup Networking Meetup",
                            Description = "Connect with fellow entrepreneurs, investors, and innovators",
                            StartDate = DateTime.UtcNow.AddDays(15),
                            EndDate = DateTime.UtcNow.AddDays(15),
                            Location = "Hanoi",
                            Address = "The Hive Coworking Space, Hoan Kiem",
                            MaxCapacity = 200,
                            CategoryId = techCategory.Id,
                            OrganizerId = organizer.Id,
                            Status = EventStatus.Published,
                            BannerImage = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
                            PosterImage = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400",
                            CreatedAt = DateTime.UtcNow,
                            ApprovedAt = DateTime.UtcNow
                        }
                    };

                    await context.Events.AddRangeAsync(events);
                    await context.SaveChangesAsync();
                    Console.WriteLine($"✅ {events.Length} sample events created!");

                    // Reload events from database to get assigned IDs
                    var savedEvents = await context.Events
                        .Where(e => e.OrganizerId == organizer.Id)
                        .ToListAsync();

                    // Add ticket types for each event
                    Console.WriteLine("Seeding Ticket Types...");
                    foreach (var evt in savedEvents)
                    {
                        // Calculate safe sale end dates
                        var eventStartDate = evt.StartDate;
                        var earlyBirdEndDate = eventStartDate.AddDays(-30);
                        
                        // Ensure early bird end date is at least 1 day after now
                        if (earlyBirdEndDate <= DateTime.UtcNow)
                        {
                            earlyBirdEndDate = DateTime.UtcNow.AddDays(5);
                        }

                        var ticketTypes = new[]
                        {
                            new TicketType
                            {
                                EventId = evt.Id,
                                Name = "General Admission",
                                Price = 500000,
                                TotalQuantity = (int)(evt.MaxCapacity * 0.6),
                                AvailableQuantity = (int)(evt.MaxCapacity * 0.6),
                                Description = "Standard entry ticket",
                                IsActive = true,
                                SaleStartDate = DateTime.UtcNow,
                                SaleEndDate = eventStartDate.AddDays(-1),
                                CreatedAt = DateTime.UtcNow
                            },
                            new TicketType
                            {
                                EventId = evt.Id,
                                Name = "VIP",
                                Price = 1500000,
                                TotalQuantity = (int)(evt.MaxCapacity * 0.3),
                                AvailableQuantity = (int)(evt.MaxCapacity * 0.3),
                                Description = "VIP access with premium seating and exclusive perks",
                                IsActive = true,
                                SaleStartDate = DateTime.UtcNow,
                                SaleEndDate = eventStartDate.AddDays(-1),
                                CreatedAt = DateTime.UtcNow
                            },
                            new TicketType
                            {
                                EventId = evt.Id,
                                Name = "Early Bird",
                                Price = 350000,
                                TotalQuantity = (int)(evt.MaxCapacity * 0.1),
                                AvailableQuantity = (int)(evt.MaxCapacity * 0.1),
                                Description = "Limited early bird discount tickets",
                                IsActive = true,
                                SaleStartDate = DateTime.UtcNow,
                                SaleEndDate = earlyBirdEndDate,
                                CreatedAt = DateTime.UtcNow
                            }
                        };

                        await context.TicketTypes.AddRangeAsync(ticketTypes);
                    }
                    await context.SaveChangesAsync();
                    Console.WriteLine("✅ Ticket types created for all events!");

                    // --- Additional seed data for easier testing ---
                    Console.WriteLine("Seeding PromoCodes, SeatMaps, Zones, Seats, Bookings, Payments, Tickets, Reviews and Waitlists...");

                    // Ensure we have references to users
                    var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@tickify.com");
                    var customerUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "customer@example.com");
                    var organizerUserAccount = await context.Users.FirstOrDefaultAsync(u => u.Email == "organizer@example.com");

                    // Seed PromoCodes
                    if (!await context.PromoCodes.AnyAsync())
                    {
                        var adminUserId = adminUser?.Id ?? 1; // Default to 1 if adminUser is null
                        
                        var promo1 = new PromoCode
                        {
                            Code = "EARLYBIRD",
                            Description = "10% off for early purchases",
                            DiscountPercent = 10m,
                            ValidFrom = DateTime.UtcNow.AddDays(-30),
                            ValidTo = DateTime.UtcNow.AddMonths(3),
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            CreatedByUserId = adminUserId
                        };

                        var promo2 = new PromoCode
                        {
                            Code = "SUMMER25",
                            Description = "25k off for bookings over 1,000,000",
                            DiscountAmount = 25000m,
                            MinimumPurchase = 1000000m,
                            ValidFrom = DateTime.UtcNow.AddDays(-10),
                            ValidTo = DateTime.UtcNow.AddMonths(2),
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            CreatedByUserId = adminUserId
                        };

                        await context.PromoCodes.AddRangeAsync(promo1, promo2);
                        await context.SaveChangesAsync();
                        Console.WriteLine("✅ Promo codes seeded.");
                    }

                    // Seed SeatMaps, Zones and Seats for ALL existing events (not just newly created ones)
                    var allEvents = await context.Events.Include(e => e.TicketTypes).ToListAsync();
                    Console.WriteLine($"Checking {allEvents.Count} events for seat map seeding...");
                    
                    foreach (var evt in allEvents)
                    {
                        // If seatmap already exists skip
                        if (await context.SeatMaps.AnyAsync(sm => sm.EventId == evt.Id))
                            continue;

                        var seatMap = new SeatMap
                        {
                            EventId = evt.Id,
                            Name = "Default SeatMap",
                            Description = "Auto-generated seat map for testing",
                            TotalRows = 5,
                            TotalColumns = 10,
                            LayoutConfig = "{ \"type\": \"grid\" }",
                            CreatedAt = DateTime.UtcNow
                        };

                        await context.SeatMaps.AddAsync(seatMap);
                        await context.SaveChangesAsync();

                        // For each ticket type of the event create a zone + some seats
                        var eventTicketTypes = await context.TicketTypes.Where(tt => tt.EventId == evt.Id).ToListAsync();
                        foreach (var tt in eventTicketTypes)
                        {
                            var zone = new SeatZone
                            {
                                SeatMapId = seatMap.Id,
                                TicketTypeId = tt.Id,
                                Name = tt.Name + " Zone",
                                Description = $"Zone for {tt.Name}",
                                StartRow = 1,
                                EndRow = 2,
                                StartColumn = 1,
                                EndColumn = 5,
                                ZonePrice = tt.Price,
                                Capacity = Math.Min(tt.TotalQuantity, 30),
                                AvailableSeats = Math.Min(tt.TotalQuantity, 30),
                                CreatedAt = DateTime.UtcNow
                            };

                            await context.SeatZones.AddAsync(zone);
                            await context.SaveChangesAsync();

                            // Create a small set of seats mapped to this zone
                            var seatsToCreate = Math.Min(10, zone.Capacity);
                            var createdSeats = new List<Seat>();
                            for (int r = 0; r < 2 && createdSeats.Count < seatsToCreate; r++)
                            {
                                var rowLabel = ((char)('A' + r)).ToString();
                                for (int s = 1; s <= 5 && createdSeats.Count < seatsToCreate; s++)
                                {
                                    var seat = new Seat
                                    {
                                        TicketTypeId = tt.Id,
                                        SeatZoneId = zone.Id,
                                        Row = rowLabel,
                                        SeatNumber = s.ToString(),
                                        GridRow = r + 1,
                                        GridColumn = s,
                                        Status = SeatStatus.Available,
                                        CreatedAt = DateTime.UtcNow
                                    };
                                    createdSeats.Add(seat);
                                }
                            }

                            if (createdSeats.Any())
                            {
                                await context.Seats.AddRangeAsync(createdSeats);
                                await context.SaveChangesAsync();
                            }
                        }
                        
                        Console.WriteLine($"✅ Created seat map for event '{evt.Title}' (ID: {evt.Id}) with {eventTicketTypes.Count} zones");
                    }

                    // Create a confirmed booking with payment and tickets for the sample customer
                    var sampleCustomer = await context.Users.FirstOrDefaultAsync(u => u.Email == "customer@example.com");
                    var firstEventForBooking = savedEvents.FirstOrDefault();
                    if (sampleCustomer != null && firstEventForBooking != null)
                    {
                        // Choose first ticket type of the event
                        var tt = await context.TicketTypes.FirstOrDefaultAsync(x => x.EventId == firstEventForBooking.Id);
                        if (tt != null)
                        {
                            // Only create if no existing booking for this customer/event
                            var exists = await context.Bookings.AnyAsync(b => b.UserId == sampleCustomer.Id && b.EventId == firstEventForBooking.Id);
                            if (!exists)
                            {
                                var qty = 2;
                                var total = tt.Price * qty;
                                var booking = new Booking
                                {
                                    BookingCode = $"BKG-{Guid.NewGuid().ToString().Substring(0,8).ToUpper()}",
                                    UserId = sampleCustomer.Id,
                                    EventId = firstEventForBooking.Id,
                                    TotalAmount = total,
                                    DiscountAmount = 0m,
                                    Status = BookingStatus.Confirmed,
                                    BookingDate = DateTime.UtcNow,
                                    ExpiresAt = null
                                };

                                await context.Bookings.AddAsync(booking);
                                await context.SaveChangesAsync();

                                // Payment
                                var payment = new Payment
                                {
                                    BookingId = booking.Id,
                                    Amount = booking.TotalAmount,
                                    Method = PaymentMethod.CreditCard,
                                    Status = PaymentStatus.Completed,
                                    TransactionId = Guid.NewGuid().ToString(),
                                    PaymentGateway = "TestGateway",
                                    PaidAt = DateTime.UtcNow,
                                    CreatedAt = DateTime.UtcNow
                                };
                                await context.Payments.AddAsync(payment);
                                await context.SaveChangesAsync();

                                // Create tickets for this booking
                                var tickets = new List<Ticket>();
                                for (int i = 0; i < qty; i++)
                                {
                                    var ticket = new Ticket
                                    {
                                        TicketCode = $"TKT-{Guid.NewGuid().ToString().Substring(0,8).ToUpper()}",
                                        BookingId = booking.Id,
                                        TicketTypeId = tt.Id,
                                        SeatId = null,
                                        SeatNumber = null,
                                        Price = tt.Price,
                                        Status = TicketStatus.Valid,
                                        CreatedAt = DateTime.UtcNow
                                    };
                                    tickets.Add(ticket);
                                }

                                await context.Tickets.AddRangeAsync(tickets);
                                await context.SaveChangesAsync();

                                Console.WriteLine("✅ Sample confirmed booking with payment and tickets created for sample customer.");
                            }
                        }
                    }

                    // Seed a review by the sample customer for the first event
                    if (sampleCustomer != null && firstEventForBooking != null)
                    {
                        var alreadyReviewed = await context.Reviews.AnyAsync(r => r.UserId == sampleCustomer.Id && r.EventId == firstEventForBooking.Id);
                        if (!alreadyReviewed)
                        {
                            var review = new Review
                            {
                                UserId = sampleCustomer.Id,
                                EventId = firstEventForBooking.Id,
                                Rating = 5,
                                Comment = "Great event sample!",
                                CreatedAt = DateTime.UtcNow
                            };
                            await context.Reviews.AddAsync(review);
                            await context.SaveChangesAsync();
                            Console.WriteLine("✅ Sample review created.");
                        }
                    }

                    // Seed a waitlist entry for another sample user (staff) for the first event
                    var sampleStaff = await context.Users.FirstOrDefaultAsync(u => u.Email == "staff@example.com");
                    if (sampleStaff != null && firstEventForBooking != null && !await context.Waitlists.AnyAsync(w => w.UserId == sampleStaff.Id && w.EventId == firstEventForBooking.Id))
                    {
                        var wait = new Waitlist
                        {
                            UserId = sampleStaff.Id,
                            EventId = firstEventForBooking.Id,
                            TicketTypeId = null,
                            RequestedQuantity = 1,
                            JoinedAt = DateTime.UtcNow,
                            ExpiresAt = DateTime.UtcNow.AddDays(7)
                        };
                        await context.Waitlists.AddAsync(wait);
                        await context.SaveChangesAsync();
                        Console.WriteLine("✅ Sample waitlist entry created.");
                    }

                    Console.WriteLine("✅ Additional test seed data created.");
                }

                // Seed SeatMaps for ALL existing events (runs independently of event creation)
                Console.WriteLine("\nChecking for seat map seeding...");
                var allExistingEvents = await context.Events.Include(e => e.TicketTypes).ToListAsync();
                Console.WriteLine($"Found {allExistingEvents.Count} events in database");
                
                foreach (var evt in allExistingEvents)
                {
                    // Skip if seatmap already exists
                    if (await context.SeatMaps.AnyAsync(sm => sm.EventId == evt.Id))
                    {
                        Console.WriteLine($"  ⏭️  Event '{evt.Title}' (ID: {evt.Id}) already has a seat map, skipping");
                        continue;
                    }

                    Console.WriteLine($"  🎫 Creating seat map for event '{evt.Title}' (ID: {evt.Id})...");

                    var seatMap = new SeatMap
                    {
                        EventId = evt.Id,
                        Name = "Default SeatMap",
                        Description = "Auto-generated seat map for testing",
                        TotalRows = 5,
                        TotalColumns = 10,
                        LayoutConfig = "{ \"type\": \"grid\" }",
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.SeatMaps.AddAsync(seatMap);
                    await context.SaveChangesAsync();

                    // For each ticket type of the event create a zone + some seats
                    var eventTicketTypes = await context.TicketTypes.Where(tt => tt.EventId == evt.Id).ToListAsync();
                    Console.WriteLine($"     Creating {eventTicketTypes.Count} zones for ticket types...");
                    
                    foreach (var tt in eventTicketTypes)
                    {
                        var zone = new SeatZone
                        {
                            SeatMapId = seatMap.Id,
                            TicketTypeId = tt.Id,
                            Name = tt.Name + " Zone",
                            Description = $"Zone for {tt.Name}",
                            StartRow = 1,
                            EndRow = 2,
                            StartColumn = 1,
                            EndColumn = 5,
                            ZonePrice = tt.Price,
                            Capacity = Math.Min(tt.TotalQuantity, 30),
                            AvailableSeats = Math.Min(tt.TotalQuantity, 30),
                            CreatedAt = DateTime.UtcNow
                        };

                        await context.SeatZones.AddAsync(zone);
                        await context.SaveChangesAsync();

                        // Create a small set of seats mapped to this zone
                        var seatsToCreate = Math.Min(10, zone.Capacity);
                        var createdSeats = new List<Seat>();
                        for (int r = 0; r < 2 && createdSeats.Count < seatsToCreate; r++)
                        {
                            var rowLabel = ((char)('A' + r)).ToString();
                            for (int s = 1; s <= 5 && createdSeats.Count < seatsToCreate; s++)
                            {
                                var seat = new Seat
                                {
                                    TicketTypeId = tt.Id,
                                    SeatZoneId = zone.Id,
                                    Row = rowLabel,
                                    SeatNumber = s.ToString(),
                                    GridRow = r + 1,
                                    GridColumn = s,
                                    Status = SeatStatus.Available,
                                    CreatedAt = DateTime.UtcNow
                                };
                                createdSeats.Add(seat);
                            }
                        }

                        if (createdSeats.Any())
                        {
                            await context.Seats.AddRangeAsync(createdSeats);
                            await context.SaveChangesAsync();
                        }
                    }
                    
                    Console.WriteLine($"  ✅ Created seat map for event '{evt.Title}' with {eventTicketTypes.Count} zones");
                }

                Console.WriteLine("\n🎉 Database seeding completed successfully!");
                Console.WriteLine("\n📝 Default Accounts:");
                Console.WriteLine("   Admin: admin@tickify.com / Admin@123456");
                Console.WriteLine("   Customer: customer@example.com / Customer@123");
                Console.WriteLine("\n💡 To add more test data, run the SQL script:");
                Console.WriteLine("   Documents/SeedTestData.sql");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error seeding database: {ex.Message}");
                Console.WriteLine($"   Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}

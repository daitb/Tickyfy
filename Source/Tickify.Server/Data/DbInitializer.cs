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

                    var organizer = new User
                    {
                        Email = "organizer@example.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Organizer@123"),
                        FullName = "Jane Smith",
                        PhoneNumber = "+84912345678",
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Users.AddAsync(organizer);
                    await context.SaveChangesAsync();

                    // Assign Organizer role
                    var organizerRole = await context.Roles.FirstAsync(r => r.Name == "Organizer");
                    var organizerUserRole = new UserRole
                    {
                        UserId = organizer.Id,
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

                Console.WriteLine("\n🎉 Database seeding completed successfully!");
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

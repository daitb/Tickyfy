-- Seed data for Tickify Database
-- This file contains sample users with known passwords for testing

-- First, insert roles
INSERT INTO [Roles] ([Name], [Description], [CreatedAt]) VALUES
('Admin', 'Administrator with full access', GETUTCDATE()),
('Staff', 'Staff member with management access', GETUTCDATE()),
('Organizer', 'Event organizer', GETUTCDATE()),
('User', 'Regular user', GETUTCDATE());
GO

-- Insert sample users with BCrypt hashed passwords
-- Passwords are hashed using BCrypt.Net.BCrypt.HashPassword()

-- Admin User
-- Email: admin@tickify.com
-- Password: Admin123!
INSERT INTO [Users] ([Email], [PasswordHash], [FullName], [PhoneNumber], [DateOfBirth], [CreatedAt], [IsActive], [IsEmailVerified]) VALUES
('admin@tickify.com', '$2a$11$pzPqZDeZHveIrI0vxFznyeJ7.WMvIt.puzKqfaaJoRecBj1IQUUgS', 'Administrator', '0123456789', '1990-01-01', GETUTCDATE(), 1, 1);

-- Staff User
-- Email: staff@tickify.com
-- Password: Staff123!
INSERT INTO [Users] ([Email], [PasswordHash], [FullName], [PhoneNumber], [DateOfBirth], [CreatedAt], [IsActive], [IsEmailVerified]) VALUES
('staff@tickify.com', '$2a$11$Txk38NUrDe5ZN6upkngJLuZD3MPfjl0MF5s3iVHUB1CjKeJuLhQba', 'Staff Member', '0123456788', '1992-02-02', GETUTCDATE(), 1, 1);

-- Organizer User
-- Email: organizer@tickify.com
-- Password: Organizer123!
INSERT INTO [Users] ([Email], [PasswordHash], [FullName], [PhoneNumber], [DateOfBirth], [CreatedAt], [IsActive], [IsEmailVerified]) VALUES
('organizer@tickify.com', '$2a$11$hg4KSAgwwpPoWDhM1F9Evu1V5EfKexqqqu1cDP96fsbWgnyo2QqnW', 'Event Organizer', '0123456787', '1985-05-15', GETUTCDATE(), 1, 1);

-- Regular User
-- Email: user@tickify.com
-- Password: User123!
INSERT INTO [Users] ([Email], [PasswordHash], [FullName], [PhoneNumber], [DateOfBirth], [CreatedAt], [IsActive], [IsEmailVerified]) VALUES
('user@tickify.com', '$2a$11$vd8HsQX0beoWqwyfa3KUa.S1bcPaVVMXCV1vvdrDwDn9h3s4UAUKm', 'Regular User', '0123456786', '1995-10-20', GETUTCDATE(), 1, 1);

-- Test User 1
-- Email: test1@example.com
-- Password: Test123!
INSERT INTO [Users] ([Email], [PasswordHash], [FullName], [PhoneNumber], [DateOfBirth], [CreatedAt], [IsActive], [IsEmailVerified]) VALUES
('test1@example.com', '$2a$11$CCpwAM.iC9M7g75XI4GraOq6qvuJfwJ63cowH4qhobT2ZalCnCbSK', 'Test User One', '0987654321', '1998-03-10', GETUTCDATE(), 1, 1);

-- Test User 2
-- Email: test2@example.com
-- Password: Test456!
INSERT INTO [Users] ([Email], [PasswordHash], [FullName], [PhoneNumber], [DateOfBirth], [CreatedAt], [IsActive], [IsEmailVerified]) VALUES
('test2@example.com', '$2a$11$w3ozLdq2sY.wOZ2aJrEBse8XccADmhmPpdN8T4kZ6uuD//MgKClHC', 'Test User Two', '0987654322', '1997-07-25', GETUTCDATE(), 1, 1);
GO

-- Assign roles to users
-- Get user IDs and role IDs
DECLARE @AdminRoleId INT = (SELECT Id FROM [Roles] WHERE [Name] = 'Admin');
DECLARE @StaffRoleId INT = (SELECT Id FROM [Roles] WHERE [Name] = 'Staff');
DECLARE @OrganizerRoleId INT = (SELECT Id FROM [Roles] WHERE [Name] = 'Organizer');
DECLARE @UserRoleId INT = (SELECT Id FROM [Roles] WHERE [Name] = 'User');

DECLARE @AdminUserId INT = (SELECT Id FROM [Users] WHERE [Email] = 'admin@tickify.com');
DECLARE @StaffUserId INT = (SELECT Id FROM [Users] WHERE [Email] = 'staff@tickify.com');
DECLARE @OrganizerUserId INT = (SELECT Id FROM [Users] WHERE [Email] = 'organizer@tickify.com');
DECLARE @RegularUserId INT = (SELECT Id FROM [Users] WHERE [Email] = 'user@tickify.com');
DECLARE @TestUser1Id INT = (SELECT Id FROM [Users] WHERE [Email] = 'test1@example.com');
DECLARE @TestUser2Id INT = (SELECT Id FROM [Users] WHERE [Email] = 'test2@example.com');

-- Assign roles
INSERT INTO [UserRoles] ([UserId], [RoleId], [AssignedAt]) VALUES
(@AdminUserId, @AdminRoleId, GETUTCDATE()),
(@StaffUserId, @StaffRoleId, GETUTCDATE()),
(@OrganizerUserId, @OrganizerRoleId, GETUTCDATE()),
(@RegularUserId, @UserRoleId, GETUTCDATE()),
(@TestUser1Id, @UserRoleId, GETUTCDATE()),
(@TestUser2Id, @UserRoleId, GETUTCDATE());
GO

-- Create organizer profile for organizer user
INSERT INTO [Organizers] ([UserId], [CompanyName], [BusinessRegistrationNumber], [TaxCode], [CompanyAddress], [CompanyPhone], [CompanyEmail], [Website], [Description], [IsVerified], [CreatedAt]) VALUES
(@OrganizerUserId, 'Sample Events Co.', 'REG123456', 'TAX789012', '123 Event Street, Ho Chi Minh City', '0123456787', 'organizer@tickify.com', 'https://sampleevents.com', 'Professional event organizer', 1, GETUTCDATE());
GO

-- Insert sample categories
INSERT INTO [Categories] ([Name], [Description], [IconUrl], [IsActive], [CreatedAt]) VALUES
('Music', 'Music concerts and festivals', 'music-icon.png', 1, GETUTCDATE()),
('Sports', 'Sports events and competitions', 'sports-icon.png', 1, GETUTCDATE()),
('Technology', 'Tech conferences and workshops', 'tech-icon.png', 1, GETUTCDATE()),
('Arts', 'Art exhibitions and performances', 'arts-icon.png', 1, GETUTCDATE()),
('Business', 'Business seminars and networking', 'business-icon.png', 1, GETUTCDATE());
GO

PRINT 'Sample data inserted successfully!';
PRINT '';
PRINT '=== LOGIN CREDENTIALS ===';
PRINT 'Admin User:';
PRINT '  Email: admin@tickify.com';
PRINT '  Password: Admin123!';
PRINT '';
PRINT 'Staff User:';
PRINT '  Email: staff@tickify.com';
PRINT '  Password: Staff123!';
PRINT '';
PRINT 'Organizer User:';
PRINT '  Email: organizer@tickify.com';
PRINT '  Password: Organizer123!';
PRINT '';
PRINT 'Regular User:';
PRINT '  Email: user@tickify.com';
PRINT '  Password: User123!';
PRINT '';
PRINT 'Test User 1:';
PRINT '  Email: test1@example.com';
PRINT '  Password: Test123!';
PRINT '';
PRINT 'Test User 2:';
PRINT '  Email: test2@example.com';
PRINT '  Password: Test456!';
PRINT '';
PRINT 'NOTE: Password hashes have been generated using BCrypt.Net.BCrypt.HashPassword()';
PRINT 'and are ready to use for authentication.';
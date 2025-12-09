CREATE TABLE [Categories] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [IconUrl] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Roles] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Email] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [FullName] nvarchar(max) NOT NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [DateOfBirth] datetime2 NULL,
    [ProfilePicture] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [IsEmailVerified] bit NOT NULL,
    [EmailVerificationToken] nvarchar(max) NULL,
    [EmailVerificationTokenExpiry] datetime2 NULL,
    [PasswordResetToken] nvarchar(max) NULL,
    [PasswordResetTokenExpiry] datetime2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Notifications] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [Type] nvarchar(max) NOT NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ReadAt] datetime2 NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Organizers] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [CompanyName] nvarchar(max) NOT NULL,
    [BusinessRegistrationNumber] nvarchar(max) NULL,
    [TaxCode] nvarchar(max) NULL,
    [CompanyAddress] nvarchar(max) NULL,
    [CompanyPhone] nvarchar(max) NULL,
    [CompanyEmail] nvarchar(max) NULL,
    [Website] nvarchar(max) NULL,
    [Logo] nvarchar(max) NULL,
    [Description] nvarchar(max) NULL,
    [IsVerified] bit NOT NULL,
    [VerifiedByStaffId] int NULL,
    [VerifiedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Organizers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Organizers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Organizers_Users_VerifiedByStaffId] FOREIGN KEY ([VerifiedByStaffId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [SupportTickets] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [Name] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [Subject] nvarchar(max) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [Status] nvarchar(450) NOT NULL,
    [Priority] nvarchar(450) NOT NULL,
    [AssignedToStaffId] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ResolvedAt] datetime2 NULL,
    CONSTRAINT [PK_SupportTickets] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SupportTickets_Users_AssignedToStaffId] FOREIGN KEY ([AssignedToStaffId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SupportTickets_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [SystemSettings] (
    [Id] int NOT NULL IDENTITY,
    [Key] nvarchar(max) NOT NULL,
    [Value] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [UpdatedByUserId] int NULL,
    CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SystemSettings_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [UserRoles] (
    [UserId] int NOT NULL,
    [RoleId] int NOT NULL,
    [AssignedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Events] (
    [Id] int NOT NULL IDENTITY,
    [Title] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [BannerImage] nvarchar(max) NULL,
    [PosterImage] nvarchar(max) NULL,
    [Location] nvarchar(max) NOT NULL,
    [Address] nvarchar(max) NULL,
    [MaxCapacity] int NULL,
    [MinimumAge] int NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [Status] int NOT NULL,
    [OrganizerId] int NOT NULL,
    [CategoryId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [ApprovedByStaffId] int NULL,
    [ApprovedAt] datetime2 NULL,
    [RejectionReason] nvarchar(max) NULL,
    CONSTRAINT [PK_Events] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Events_Dates_Valid] CHECK ([EndDate] >= [StartDate]),
    CONSTRAINT [CK_Events_MaxCapacity_Positive] CHECK ([MaxCapacity] IS NULL OR [MaxCapacity] > 0),
    CONSTRAINT [CK_Events_MinimumAge_Valid] CHECK ([MinimumAge] IS NULL OR ([MinimumAge] >= 0 AND [MinimumAge] <= 120)),
    CONSTRAINT [FK_Events_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Events_Organizers_OrganizerId] FOREIGN KEY ([OrganizerId]) REFERENCES [Organizers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Events_Users_ApprovedByStaffId] FOREIGN KEY ([ApprovedByStaffId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Payouts] (
    [Id] int NOT NULL IDENTITY,
    [OrganizerId] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [BankName] nvarchar(max) NULL,
    [BankAccountNumber] nvarchar(max) NULL,
    [BankAccountName] nvarchar(max) NULL,
    [RequestedAt] datetime2 NOT NULL,
    [ProcessedByStaffId] int NULL,
    [ProcessedAt] datetime2 NULL,
    [Notes] nvarchar(max) NULL,
    CONSTRAINT [PK_Payouts] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Payouts_Amount_Positive] CHECK ([Amount] > 0),
    CONSTRAINT [FK_Payouts_Organizers_OrganizerId] FOREIGN KEY ([OrganizerId]) REFERENCES [Organizers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Payouts_Users_ProcessedByStaffId] FOREIGN KEY ([ProcessedByStaffId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [SupportMessages] (
    [Id] int NOT NULL IDENTITY,
    [SupportTicketId] int NOT NULL,
    [UserId] int NULL,
    [Message] nvarchar(max) NOT NULL,
    [IsStaffReply] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SupportMessages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SupportMessages_SupportTickets_SupportTicketId] FOREIGN KEY ([SupportTicketId]) REFERENCES [SupportTickets] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SupportMessages_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO


CREATE TABLE [PromoCodes] (
    [Id] int NOT NULL IDENTITY,
    [Code] nvarchar(450) NOT NULL,
    [Description] nvarchar(max) NULL,
    [EventId] int NULL,
    [OrganizerId] int NULL,
    [DiscountPercent] decimal(5,2) NULL,
    [DiscountAmount] decimal(18,2) NULL,
    [MinimumPurchase] decimal(18,2) NULL,
    [MaxUses] int NULL,
    [CurrentUses] int NOT NULL,
    [MaxUsesPerUser] int NULL,
    [ValidFrom] datetime2 NULL,
    [ValidTo] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedByUserId] int NOT NULL,
    CONSTRAINT [PK_PromoCodes] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_PromoCodes_CurrentUses_Valid] CHECK ([MaxUses] IS NULL OR [CurrentUses] <= [MaxUses]),
    CONSTRAINT [CK_PromoCodes_Dates_Valid] CHECK ([ValidTo] >= [ValidFrom]),
    CONSTRAINT [CK_PromoCodes_DiscountAmount_NonNegative] CHECK ([DiscountAmount] IS NULL OR [DiscountAmount] >= 0),
    CONSTRAINT [CK_PromoCodes_DiscountPercent_Valid] CHECK ([DiscountPercent] IS NULL OR ([DiscountPercent] >= 0 AND [DiscountPercent] <= 100)),
    CONSTRAINT [CK_PromoCodes_MaxUses_Positive] CHECK ([MaxUses] IS NULL OR [MaxUses] > 0),
    CONSTRAINT [CK_PromoCodes_MinimumPurchase_NonNegative] CHECK ([MinimumPurchase] IS NULL OR [MinimumPurchase] >= 0),
    CONSTRAINT [FK_PromoCodes_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PromoCodes_Organizers_OrganizerId] FOREIGN KEY ([OrganizerId]) REFERENCES [Organizers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PromoCodes_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Reviews] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [EventId] int NOT NULL,
    [Rating] int NOT NULL,
    [Comment] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Reviews] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Reviews_Rating_Valid] CHECK ([Rating] >= 1 AND [Rating] <= 5),
    CONSTRAINT [FK_Reviews_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Reviews_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [TicketTypes] (
    [Id] int NOT NULL IDENTITY,
    [EventId] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [Price] decimal(18,2) NOT NULL,
    [TotalQuantity] int NOT NULL,
    [AvailableQuantity] int NOT NULL,
    [Zone] nvarchar(max) NULL,
    [HasSeatSelection] bit NOT NULL,
    [SaleStartDate] datetime2 NULL,
    [SaleEndDate] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_TicketTypes] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_TicketTypes_Available_LTE_Total] CHECK ([AvailableQuantity] >= 0 AND [AvailableQuantity] <= [TotalQuantity]),
    CONSTRAINT [CK_TicketTypes_Price_NonNegative] CHECK ([Price] >= 0),
    CONSTRAINT [CK_TicketTypes_SaleDates_Valid] CHECK ([SaleEndDate] IS NULL OR [SaleStartDate] IS NULL OR [SaleEndDate] >= [SaleStartDate]),
    CONSTRAINT [CK_TicketTypes_TotalQuantity_Positive] CHECK ([TotalQuantity] > 0),
    CONSTRAINT [FK_TicketTypes_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Wishlists] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [EventId] int NOT NULL,
    [AddedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Wishlists] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Wishlists_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Wishlists_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Bookings] (
    [Id] int NOT NULL IDENTITY,
    [BookingCode] nvarchar(450) NOT NULL,
    [UserId] int NOT NULL,
    [EventId] int NOT NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [PromoCodeId] int NULL,
    [DiscountAmount] decimal(18,2) NOT NULL,
    [Status] int NOT NULL,
    [BookingDate] datetime2 NOT NULL,
    [ExpiresAt] datetime2 NULL,
    [CancelledAt] datetime2 NULL,
    [CancellationReason] nvarchar(max) NULL,
    [IsRefundRequested] bit NOT NULL,
    [IsRefunded] bit NOT NULL,
    [RefundedAt] datetime2 NULL,
    CONSTRAINT [PK_Bookings] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Bookings_Discount_LTE_Total] CHECK ([DiscountAmount] >= 0 AND [DiscountAmount] <= [TotalAmount]),
    CONSTRAINT [CK_Bookings_ExpiresAt_Future] CHECK ([ExpiresAt] IS NULL OR [ExpiresAt] > [BookingDate]),
    CONSTRAINT [CK_Bookings_TotalAmount_NonNegative] CHECK ([TotalAmount] >= 0),
    CONSTRAINT [FK_Bookings_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bookings_PromoCodes_PromoCodeId] FOREIGN KEY ([PromoCodeId]) REFERENCES [PromoCodes] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bookings_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Seats] (
    [Id] int NOT NULL IDENTITY,
    [TicketTypeId] int NOT NULL,
    [Row] nvarchar(max) NOT NULL,
    [SeatNumber] nvarchar(max) NOT NULL,
    [IsAvailable] bit NOT NULL,
    [IsBlocked] bit NOT NULL,
    [BlockedReason] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Seats] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Seats_TicketTypes_TicketTypeId] FOREIGN KEY ([TicketTypeId]) REFERENCES [TicketTypes] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Waitlists] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [EventId] int NOT NULL,
    [TicketTypeId] int NULL,
    [RequestedQuantity] int NOT NULL,
    [JoinedAt] datetime2 NOT NULL,
    [IsNotified] bit NOT NULL,
    [NotifiedAt] datetime2 NULL,
    [ExpiresAt] datetime2 NULL,
    [HasPurchased] bit NOT NULL,
    [PurchasedAt] datetime2 NULL,
    CONSTRAINT [PK_Waitlists] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Waitlists_Quantity_Positive] CHECK ([RequestedQuantity] > 0),
    CONSTRAINT [FK_Waitlists_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Waitlists_TicketTypes_TicketTypeId] FOREIGN KEY ([TicketTypeId]) REFERENCES [TicketTypes] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Waitlists_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Payments] (
    [Id] int NOT NULL IDENTITY,
    [BookingId] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Method] int NOT NULL,
    [Status] int NOT NULL,
    [TransactionId] nvarchar(max) NULL,
    [PaymentGateway] nvarchar(max) NULL,
    [PaymentResponse] nvarchar(max) NULL,
    [PaidAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [InvoiceUrl] nvarchar(max) NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Payments_Amount_Positive] CHECK ([Amount] > 0),
    CONSTRAINT [FK_Payments_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [RefundRequests] (
    [Id] int NOT NULL IDENTITY,
    [BookingId] int NOT NULL,
    [UserId] int NOT NULL,
    [Reason] nvarchar(max) NOT NULL,
    [RefundAmount] decimal(18,2) NOT NULL,
    [Status] nvarchar(450) NOT NULL,
    [ReviewedByStaffId] int NULL,
    [ReviewedAt] datetime2 NULL,
    [StaffNotes] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ProcessedAt] datetime2 NULL,
    CONSTRAINT [PK_RefundRequests] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_RefundRequests_Amount_Positive] CHECK ([RefundAmount] > 0),
    CONSTRAINT [FK_RefundRequests_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RefundRequests_Users_ReviewedByStaffId] FOREIGN KEY ([ReviewedByStaffId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RefundRequests_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Tickets] (
    [Id] int NOT NULL IDENTITY,
    [TicketCode] nvarchar(450) NOT NULL,
    [BookingId] int NOT NULL,
    [TicketTypeId] int NOT NULL,
    [SeatId] int NULL,
    [SeatNumber] nvarchar(max) NULL,
    [Price] decimal(18,2) NOT NULL,
    [Status] int NOT NULL,
    [UsedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Tickets_Price_NonNegative] CHECK ([Price] >= 0),
    CONSTRAINT [FK_Tickets_Bookings_BookingId] FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Tickets_Seats_SeatId] FOREIGN KEY ([SeatId]) REFERENCES [Seats] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Tickets_TicketTypes_TicketTypeId] FOREIGN KEY ([TicketTypeId]) REFERENCES [TicketTypes] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [TicketScans] (
    [Id] int NOT NULL IDENTITY,
    [TicketId] int NOT NULL,
    [ScannedAt] datetime2 NOT NULL,
    [ScannedByUserId] int NOT NULL,
    [ScanLocation] nvarchar(max) NOT NULL,
    [ScanType] nvarchar(max) NOT NULL,
    [DeviceId] nvarchar(max) NULL,
    [IsValid] bit NOT NULL,
    [Notes] nvarchar(max) NULL,
    CONSTRAINT [PK_TicketScans] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TicketScans_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TicketScans_Users_ScannedByUserId] FOREIGN KEY ([ScannedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [TicketTransfers] (
    [Id] int NOT NULL IDENTITY,
    [TicketId] int NOT NULL,
    [FromUserId] int NOT NULL,
    [ToUserId] int NOT NULL,
    [TransferredAt] datetime2 NOT NULL,
    [Reason] nvarchar(max) NULL,
    [IsApproved] bit NOT NULL,
    [ApprovedByUserId] int NULL,
    CONSTRAINT [PK_TicketTransfers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TicketTransfers_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TicketTransfers_Users_ApprovedByUserId] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TicketTransfers_Users_FromUserId] FOREIGN KEY ([FromUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TicketTransfers_Users_ToUserId] FOREIGN KEY ([ToUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE UNIQUE INDEX [IX_Bookings_BookingCode] ON [Bookings] ([BookingCode]);
GO


CREATE INDEX [IX_Bookings_BookingDate] ON [Bookings] ([BookingDate]);
GO


CREATE INDEX [IX_Bookings_EventId] ON [Bookings] ([EventId]);
GO


CREATE INDEX [IX_Bookings_PromoCodeId] ON [Bookings] ([PromoCodeId]);
GO


CREATE INDEX [IX_Bookings_Status] ON [Bookings] ([Status]);
GO


CREATE INDEX [IX_Bookings_Status_ExpiresAt] ON [Bookings] ([Status], [ExpiresAt]);
GO


CREATE INDEX [IX_Bookings_UserId] ON [Bookings] ([UserId]);
GO


CREATE INDEX [IX_Events_ApprovedByStaffId] ON [Events] ([ApprovedByStaffId]);
GO


CREATE INDEX [IX_Events_CategoryId] ON [Events] ([CategoryId]);
GO


CREATE INDEX [IX_Events_OrganizerId] ON [Events] ([OrganizerId]);
GO


CREATE INDEX [IX_Events_StartDate] ON [Events] ([StartDate]);
GO


CREATE INDEX [IX_Events_Status] ON [Events] ([Status]);
GO


CREATE INDEX [IX_Events_Status_StartDate] ON [Events] ([Status], [StartDate]);
GO


CREATE INDEX [IX_Notifications_CreatedAt] ON [Notifications] ([CreatedAt]);
GO


CREATE INDEX [IX_Notifications_UserId_IsRead] ON [Notifications] ([UserId], [IsRead]);
GO


CREATE UNIQUE INDEX [IX_Organizers_UserId] ON [Organizers] ([UserId]);
GO


CREATE INDEX [IX_Organizers_VerifiedByStaffId] ON [Organizers] ([VerifiedByStaffId]);
GO


CREATE UNIQUE INDEX [IX_Payments_BookingId] ON [Payments] ([BookingId]);
GO


CREATE INDEX [IX_Payments_PaidAt] ON [Payments] ([PaidAt]);
GO


CREATE INDEX [IX_Payments_Status] ON [Payments] ([Status]);
GO


CREATE INDEX [IX_Payouts_OrganizerId] ON [Payouts] ([OrganizerId]);
GO


CREATE INDEX [IX_Payouts_ProcessedByStaffId] ON [Payouts] ([ProcessedByStaffId]);
GO


CREATE UNIQUE INDEX [IX_PromoCodes_Code] ON [PromoCodes] ([Code]);
GO


CREATE INDEX [IX_PromoCodes_CreatedByUserId] ON [PromoCodes] ([CreatedByUserId]);
GO


CREATE INDEX [IX_PromoCodes_EventId] ON [PromoCodes] ([EventId]);
GO


CREATE INDEX [IX_PromoCodes_IsActive] ON [PromoCodes] ([IsActive]);
GO


CREATE INDEX [IX_PromoCodes_OrganizerId] ON [PromoCodes] ([OrganizerId]);
GO


CREATE INDEX [IX_PromoCodes_ValidFrom_ValidTo] ON [PromoCodes] ([ValidFrom], [ValidTo]);
GO


CREATE INDEX [IX_RefundRequests_BookingId] ON [RefundRequests] ([BookingId]);
GO


CREATE INDEX [IX_RefundRequests_ReviewedByStaffId] ON [RefundRequests] ([ReviewedByStaffId]);
GO


CREATE INDEX [IX_RefundRequests_Status] ON [RefundRequests] ([Status]);
GO


CREATE INDEX [IX_RefundRequests_UserId] ON [RefundRequests] ([UserId]);
GO


CREATE INDEX [IX_Reviews_EventId] ON [Reviews] ([EventId]);
GO


CREATE INDEX [IX_Reviews_UserId] ON [Reviews] ([UserId]);
GO


CREATE INDEX [IX_Seats_TicketTypeId_IsAvailable] ON [Seats] ([TicketTypeId], [IsAvailable]);
GO


CREATE INDEX [IX_SupportMessages_SupportTicketId] ON [SupportMessages] ([SupportTicketId]);
GO


CREATE INDEX [IX_SupportMessages_UserId] ON [SupportMessages] ([UserId]);
GO


CREATE INDEX [IX_SupportTickets_AssignedToStaffId] ON [SupportTickets] ([AssignedToStaffId]);
GO


CREATE INDEX [IX_SupportTickets_Status_Priority] ON [SupportTickets] ([Status], [Priority]);
GO


CREATE INDEX [IX_SupportTickets_UserId] ON [SupportTickets] ([UserId]);
GO


CREATE INDEX [IX_SystemSettings_UpdatedByUserId] ON [SystemSettings] ([UpdatedByUserId]);
GO


CREATE INDEX [IX_Tickets_BookingId] ON [Tickets] ([BookingId]);
GO


CREATE INDEX [IX_Tickets_SeatId] ON [Tickets] ([SeatId]);
GO


CREATE INDEX [IX_Tickets_Status] ON [Tickets] ([Status]);
GO


CREATE UNIQUE INDEX [IX_Tickets_TicketCode] ON [Tickets] ([TicketCode]);
GO


CREATE INDEX [IX_Tickets_TicketTypeId] ON [Tickets] ([TicketTypeId]);
GO


CREATE INDEX [IX_TicketScans_ScannedAt] ON [TicketScans] ([ScannedAt]);
GO


CREATE INDEX [IX_TicketScans_ScannedByUserId] ON [TicketScans] ([ScannedByUserId]);
GO


CREATE INDEX [IX_TicketScans_TicketId] ON [TicketScans] ([TicketId]);
GO


CREATE INDEX [IX_TicketTransfers_ApprovedByUserId] ON [TicketTransfers] ([ApprovedByUserId]);
GO


CREATE INDEX [IX_TicketTransfers_FromUserId] ON [TicketTransfers] ([FromUserId]);
GO


CREATE INDEX [IX_TicketTransfers_TicketId] ON [TicketTransfers] ([TicketId]);
GO


CREATE INDEX [IX_TicketTransfers_ToUserId] ON [TicketTransfers] ([ToUserId]);
GO


CREATE INDEX [IX_TicketTypes_EventId] ON [TicketTypes] ([EventId]);
GO


CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
GO


CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO


CREATE INDEX [IX_Users_IsActive] ON [Users] ([IsActive]);
GO


CREATE INDEX [IX_Waitlists_EventId_IsNotified_JoinedAt] ON [Waitlists] ([EventId], [IsNotified], [JoinedAt]);
GO


CREATE INDEX [IX_Waitlists_ExpiresAt] ON [Waitlists] ([ExpiresAt]);
GO


CREATE INDEX [IX_Waitlists_TicketTypeId] ON [Waitlists] ([TicketTypeId]);
GO


CREATE INDEX [IX_Waitlists_UserId] ON [Waitlists] ([UserId]);
GO


CREATE INDEX [IX_Wishlists_EventId] ON [Wishlists] ([EventId]);
GO


CREATE INDEX [IX_Wishlists_UserId] ON [Wishlists] ([UserId]);
GO



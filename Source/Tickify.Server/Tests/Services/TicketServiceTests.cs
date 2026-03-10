// using Microsoft.EntityFrameworkCore;
// using Moq;
// using Xunit;
// using AutoMapper;
// using Tickify.Data;
// using Tickify.Models;
// using Tickify.Services;
// using Tickify.Interfaces.Repositories;
// using Tickify.Services.Email;
// using Tickify.DTOs.Ticket;
// using Tickify.Exceptions;
// using Tickify.Repositories;

// namespace Tickify.Tests.Services
// {
//     public class TicketServiceTests : IDisposable
//     {
//         private readonly ApplicationDbContext _context;
//         private readonly Mock<ITicketRepository> _mockTicketRepository;
//         private readonly Mock<IBookingRepository> _mockBookingRepository;
//         private readonly Mock<ITicketTransferRepository> _mockTicketTransferRepository;
//         private readonly Mock<ITicketScanRepository> _mockTicketScanRepository;
//         private readonly Mock<IUserRepository> _mockUserRepository;
//         private readonly Mock<IEmailService> _mockEmailService;
//         private readonly Mock<IMapper> _mockMapper;
//         private readonly TicketService _ticketService;

//         public TicketServiceTests()
//         {
//             // Setup InMemory Database with unique name for each test
//             var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//                 .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
//                 .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
//                 .Options;

//             _context = new ApplicationDbContext(options);
//             _mockTicketRepository = new Mock<ITicketRepository>();
//             _mockBookingRepository = new Mock<IBookingRepository>();
//             _mockTicketTransferRepository = new Mock<ITicketTransferRepository>();
//             _mockTicketScanRepository = new Mock<ITicketScanRepository>();
//             _mockUserRepository = new Mock<IUserRepository>();
//             _mockEmailService = new Mock<IEmailService>();
//             _mockMapper = new Mock<IMapper>();

//             _ticketService = new TicketService(
//                 _mockTicketRepository.Object,
//                 _mockBookingRepository.Object,
//                 _mockTicketTransferRepository.Object,
//                 _mockTicketScanRepository.Object,
//                 _mockUserRepository.Object,
//                 _mockEmailService.Object,
//                 _mockMapper.Object
//             );
//         }

//         public void Dispose()
//         {
//             _context.Database.EnsureDeleted();
//             _context.Dispose();
//         }

//         #region Get Ticket Tests

//         [Fact]
//         public async Task GetTicketById_WithValidId_ReturnsTicketWithQR()
//         {
//             // Arrange
//             var ticketId = 1;
//             var ticket = new Ticket
//             {
//                 Id = ticketId,
//                 TicketCode = "TKT001",
//                 BookingId = 1,
//                 TicketTypeId = 1,
//                 Price = 500000,
//                 Status = TicketStatus.Valid,
//                 CreatedAt = DateTime.UtcNow
//             };

//             var ticketDto = new TicketDto
//             {
//                 TicketId = ticketId,
//                 TicketNumber = "TKT001",
//                 Price = 500000,
//                 Status = "Valid"
//             };

//             _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
//                 .ReturnsAsync(ticket);
//             _mockMapper.Setup(m => m.Map<TicketDto>(It.IsAny<Ticket>()))
//                 .Returns(ticketDto);

//             // Act
//             var result = await _ticketService.GetByIdAsync(ticketId);

//             // Assert
//             Assert.NotNull(result);
//             Assert.Equal(ticketId, result.TicketId);
//             Assert.Equal("TKT001", result.TicketNumber);
//             Assert.Equal("Valid", result.Status);
//             _mockTicketRepository.Verify(r => r.GetByIdAsync(ticketId), Times.Once);
//         }

//         [Fact]
//         public async Task GetTicketById_WithInvalidId_ThrowsNotFoundException()
//         {
//             // Arrange
//             var ticketId = 999;
//             _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
//                 .ReturnsAsync((Ticket?)null);

//             // Act & Assert
//             await Assert.ThrowsAsync<NotFoundException>(() => 
//                 _ticketService.GetByIdAsync(ticketId));
//         }

//         [Fact]
//         public async Task GetUserTickets_WithFilters_ReturnsFilteredTickets()
//         {
//             // Arrange
//             var userId = 1;
//             var upcomingEventDate = DateTime.UtcNow.AddDays(7);
//             var pastEventDate = DateTime.UtcNow.AddDays(-7);

//             var tickets = new List<Ticket>
//             {
//                 new Ticket 
//                 { 
//                     Id = 1, 
//                     TicketCode = "TKT001", 
//                     BookingId = 1, 
//                     Status = TicketStatus.Valid,
//                     Booking = new Booking 
//                     { 
//                         Id = 1, 
//                         EventId = 1,
//                         Event = new Event { Id = 1, StartDate = upcomingEventDate }
//                     }
//                 },
//                 new Ticket 
//                 { 
//                     Id = 2, 
//                     TicketCode = "TKT002", 
//                     BookingId = 2, 
//                     Status = TicketStatus.Used,
//                     Booking = new Booking 
//                     { 
//                         Id = 2, 
//                         EventId = 2,
//                         Event = new Event { Id = 2, StartDate = pastEventDate }
//                     }
//                 }
//             };

//             var upcomingTicketDtos = new List<TicketDetailDto>
//             {
//                 new TicketDetailDto 
//                 { 
//                     TicketId = 1, 
//                     TicketNumber = "TKT001", 
//                     EventStartDate = upcomingEventDate,
//                     Status = "Valid"
//                 }
//             };

//             _mockTicketRepository.Setup(r => r.GetByUserIdAsync(userId))
//                 .ReturnsAsync(tickets);
//             _mockMapper.Setup(m => m.Map<IEnumerable<TicketDetailDto>>(It.IsAny<IEnumerable<Ticket>>()))
//                 .Returns(upcomingTicketDtos);

//             // Act
//             var result = await _ticketService.GetUserTicketsAsync(userId);

//             // Assert
//             Assert.NotNull(result);
//             var resultList = result.ToList();
//             Assert.Single(resultList); // Only upcoming ticket returned based on mapping
//             Assert.Equal("TKT001", resultList[0].TicketNumber);
//             Assert.Equal("Valid", resultList[0].Status);
//         }

//         #endregion

//         #region Transfer Ticket Tests

//         [Fact]
//         public async Task TransferTicket_ToAnotherUser_CreatesTransferRequest()
//         {
//             // Arrange
//             var ticketId = 1;
//             var userId = 100;
//             var recipientEmail = "recipient@test.com";
            
//             var ticket = new Ticket
//             {
//                 Id = ticketId,
//                 TicketCode = "TKT001",
//                 BookingId = 1,
//                 Status = TicketStatus.Valid
//             };

//             var booking = new Booking
//             {
//                 Id = 1,
//                 UserId = userId,
//                 EventId = 1
//             };

//             var recipientUser = new User
//             {
//                 Id = 200,
//                 Email = recipientEmail,
//                 FullName = "Recipient Name"
//             };

//             var senderUser = new User
//             {
//                 Id = userId,
//                 Email = "sender@test.com",
//                 FullName = "Sender Name"
//             };

//             var transferDto = new TicketTransferDto
//             {
//                 RecipientEmail = recipientEmail,
//                 Message = "Transfer message"
//             };

//             var createdTransfer = new TicketTransfer
//             {
//                 Id = 1,
//                 TicketId = ticketId,
//                 FromUserId = userId,
//                 ToUserId = recipientUser.Id,
//                 TransferredAt = DateTime.UtcNow,
//                 IsApproved = false
//             };

//             _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
//                 .ReturnsAsync(ticket);
//             _mockBookingRepository.Setup(r => r.GetByIdAsync(booking.Id))
//                 .ReturnsAsync(booking);
//             _mockUserRepository.Setup(r => r.GetUserByEmailAsync(recipientEmail))
//                 .ReturnsAsync(recipientUser);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
//                 .ReturnsAsync(senderUser);
//             _mockTicketTransferRepository.Setup(r => r.CreateAsync(It.IsAny<TicketTransfer>()))
//                 .ReturnsAsync(createdTransfer);
//             _mockEmailService.Setup(e => e.SendTicketTransferNotificationAsync(
//                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), 
//                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>()))
//                 .Returns(Task.CompletedTask);
//             _mockMapper.Setup(m => m.Map<TicketDto>(It.IsAny<Ticket>()))
//                 .Returns(new TicketDto { TicketId = ticketId, TicketNumber = "TKT001" });

//             // Act
//             var result = await _ticketService.TransferTicketAsync(ticketId, transferDto, userId);

//             // Assert
//             Assert.NotNull(result);
//             Assert.Equal(ticketId, result.TicketId);
//             _mockTicketTransferRepository.Verify(r => r.CreateAsync(It.Is<TicketTransfer>(t =>
//                 t.TicketId == ticketId &&
//                 t.FromUserId == userId &&
//                 t.ToUserId == recipientUser.Id &&
//                 t.IsApproved == false &&
//                 !string.IsNullOrEmpty(t.AcceptanceToken) &&
//                 t.AcceptanceExpiresAt.HasValue
//             )), Times.Once);
//             _mockEmailService.Verify(e => e.SendTicketTransferNotificationAsync(
//                 recipientEmail,
//                 It.IsAny<string>(),
//                 It.IsAny<string>(),
//                 "TKT001",
//                 It.IsAny<string>(),
//                 It.IsAny<string>(),
//                 It.IsAny<int>()
//             ), Times.Once);
//         }

//         [Fact]
//         public async Task TransferTicket_AlreadyUsed_ThrowsException()
//         {
//             // Arrange
//             var ticketId = 1;
//             var userId = 100;
            
//             var ticket = new Ticket
//             {
//                 Id = ticketId,
//                 TicketCode = "TKT001",
//                 BookingId = 1,
//                 Status = TicketStatus.Used, // Already used
//                 UsedAt = DateTime.UtcNow.AddDays(-1)
//             };

//             var booking = new Booking
//             {
//                 Id = 1,
//                 UserId = userId,
//                 EventId = 1
//             };

//             var transferDto = new TicketTransferDto
//             {
//                 RecipientEmail = "recipient@test.com",
//                 Message = "Transfer message"
//             };

//             _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
//                 .ReturnsAsync(ticket);
//             _mockBookingRepository.Setup(r => r.GetByIdAsync(booking.Id))
//                 .ReturnsAsync(booking);

//             // Act & Assert
//             var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
//                 _ticketService.TransferTicketAsync(ticketId, transferDto, userId));
            
//             Assert.Contains("Only valid tickets can be transferred", exception.Message);
//         }

//         [Fact]
//         public async Task TransferTicket_ToSelf_ThrowsException()
//         {
//             // Arrange
//             var ticketId = 1;
//             var userId = 100;
            
//             var ticket = new Ticket
//             {
//                 Id = ticketId,
//                 TicketCode = "TKT001",
//                 BookingId = 1,
//                 Status = TicketStatus.Valid
//             };

//             var booking = new Booking
//             {
//                 Id = 1,
//                 UserId = userId,
//                 EventId = 1
//             };

//             var sameUser = new User
//             {
//                 Id = userId,
//                 Email = "user@test.com",
//                 FullName = "Same User"
//             };

//             var transferDto = new TicketTransferDto
//             {
//                 RecipientEmail = "user@test.com",
//                 Message = "Transfer to myself"
//             };

//             _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
//                 .ReturnsAsync(ticket);
//             _mockBookingRepository.Setup(r => r.GetByIdAsync(booking.Id))
//                 .ReturnsAsync(booking);
//             _mockUserRepository.Setup(r => r.GetUserByEmailAsync("user@test.com"))
//                 .ReturnsAsync(sameUser);

//             // Act & Assert
//             var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
//                 _ticketService.TransferTicketAsync(ticketId, transferDto, userId));
            
//             Assert.Contains("You cannot transfer a ticket to yourself", exception.Message);
//         }

//         #endregion

//         #region Accept/Reject Transfer Tests

//         [Fact]
//         public async Task AcceptTransfer_WithValidToken_TransfersOwnership()
//         {
//             // Arrange
//             var transferId = 1;
//             var ticketId = 1;
//             var fromUserId = 100;
//             var toUserId = 200;
//             var acceptanceToken = "valid-token-12345";

//             var transfer = new TicketTransfer
//             {
//                 Id = transferId,
//                 TicketId = ticketId,
//                 FromUserId = fromUserId,
//                 ToUserId = toUserId,
//                 IsApproved = false,
//                 AcceptanceToken = acceptanceToken,
//                 AcceptanceExpiresAt = DateTime.UtcNow.AddDays(3)
//             };

//             var ticket = new Ticket
//             {
//                 Id = ticketId,
//                 TicketCode = "TKT001",
//                 BookingId = 1,
//                 Status = TicketStatus.Valid
//             };

//             var oldBooking = new Booking
//             {
//                 Id = 1,
//                 UserId = fromUserId,
//                 EventId = 1
//             };

//             var newBooking = new Booking
//             {
//                 Id = 2,
//                 UserId = toUserId,
//                 EventId = 1,
//                 Status = BookingStatus.Confirmed
//             };

//             var fromUser = new User { Id = fromUserId, Email = "sender@test.com", FullName = "Sender" };
//             var toUser = new User { Id = toUserId, Email = "recipient@test.com", FullName = "Recipient" };

//             var acceptDto = new AcceptTransferDto
//             {
//                 TransferId = transferId,
//                 AcceptanceToken = acceptanceToken
//             };

//             _mockTicketTransferRepository.Setup(r => r.GetByIdAsync(transferId))
//                 .ReturnsAsync(transfer);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(fromUserId))
//                 .ReturnsAsync(fromUser);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(toUserId))
//                 .ReturnsAsync(toUser);
//             _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
//                 .ReturnsAsync(ticket);
//             _mockBookingRepository.Setup(r => r.GetByIdAsync(1))
//                 .ReturnsAsync(oldBooking);
//             _mockBookingRepository.Setup(r => r.CreateAsync(It.IsAny<Booking>()))
//                 .ReturnsAsync(newBooking);
//             _mockTicketRepository.Setup(r => r.UpdateAsync(It.IsAny<Ticket>()))
//                 .ReturnsAsync(ticket);
//             _mockTicketTransferRepository.Setup(r => r.UpdateAsync(It.IsAny<TicketTransfer>()))
//                 .ReturnsAsync(transfer);
//             _mockEmailService.Setup(e => e.SendTicketTransferAcceptedNotificationAsync(
//                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
//                 .Returns(Task.CompletedTask);
//             _mockEmailService.Setup(e => e.SendTicketTransferAcceptedConfirmationAsync(
//                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
//                 .Returns(Task.CompletedTask);
//             _mockMapper.Setup(m => m.Map<TicketDto>(It.IsAny<Ticket>()))
//                 .Returns(new TicketDto { TicketId = ticketId, TicketNumber = "TKT001" });

//             // Act
//             var result = await _ticketService.AcceptTransferAsync(acceptDto, toUserId);

//             // Assert
//             Assert.NotNull(result);
//             Assert.Equal(ticketId, result.TicketId);
//             _mockBookingRepository.Verify(r => r.CreateAsync(It.Is<Booking>(b =>
//                 b.UserId == toUserId &&
//                 b.EventId == 1 &&
//                 b.TotalAmount == 0 &&
//                 b.Status == BookingStatus.Confirmed
//             )), Times.Once);
//             _mockTicketRepository.Verify(r => r.UpdateAsync(It.Is<Ticket>(t =>
//                 t.BookingId == newBooking.Id
//             )), Times.Once);
//             _mockTicketTransferRepository.Verify(r => r.UpdateAsync(It.Is<TicketTransfer>(t =>
//                 t.IsApproved == true &&
//                 t.ApprovedByUserId == toUserId
//             )), Times.Once);
//             _mockEmailService.Verify(e => e.SendTicketTransferAcceptedNotificationAsync(
//                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), "TKT001"
//             ), Times.Once);
//         }

//         [Fact]
//         public async Task AcceptTransfer_WithWrongUser_ThrowsUnauthorizedException()
//         {
//             // Arrange
//             var transferId = 1;
//             var toUserId = 200;
//             var wrongUserId = 300;

//             var transfer = new TicketTransfer
//             {
//                 Id = transferId,
//                 ToUserId = toUserId,
//                 IsApproved = false,
//                 AcceptanceToken = "valid-token"
//             };

//             var recipientUser = new User { Id = toUserId, Email = "recipient@test.com" };
//             var wrongUser = new User { Id = wrongUserId, Email = "wrong@test.com" };

//             _mockTicketTransferRepository.Setup(r => r.GetByIdAsync(transferId))
//                 .ReturnsAsync(transfer);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(toUserId))
//                 .ReturnsAsync(recipientUser);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(wrongUserId))
//                 .ReturnsAsync(wrongUser);

//             var acceptDto = new AcceptTransferDto
//             {
//                 TransferId = transferId,
//                 AcceptanceToken = "valid-token"
//             };

//             // Act & Assert
//             var exception = await Assert.ThrowsAsync<UnauthorizedException>(() =>
//                 _ticketService.AcceptTransferAsync(acceptDto, wrongUserId));
            
//             Assert.Contains("This transfer was sent to", exception.Message);
//         }

//         [Fact]
//         public async Task AcceptTransfer_WithExpiredToken_ThrowsException()
//         {
//             // Arrange
//             var transferId = 1;
//             var toUserId = 200;

//             var transfer = new TicketTransfer
//             {
//                 Id = transferId,
//                 ToUserId = toUserId,
//                 IsApproved = false,
//                 AcceptanceToken = "valid-token",
//                 AcceptanceExpiresAt = DateTime.UtcNow.AddDays(-1) // Expired
//             };

//             var toUser = new User { Id = toUserId, Email = "recipient@test.com" };

//             _mockTicketTransferRepository.Setup(r => r.GetByIdAsync(transferId))
//                 .ReturnsAsync(transfer);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(toUserId))
//                 .ReturnsAsync(toUser);

//             var acceptDto = new AcceptTransferDto
//             {
//                 TransferId = transferId,
//                 AcceptanceToken = "valid-token"
//             };

//             // Act & Assert
//             var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
//                 _ticketService.AcceptTransferAsync(acceptDto, toUserId));
            
//             Assert.Contains("Acceptance token has expired", exception.Message);
//         }

//         [Fact]
//         public async Task RejectTransfer_WithValidToken_CancelsTransfer()
//         {
//             // Arrange
//             var transferId = 1;
//             var ticketId = 1;
//             var fromUserId = 100;
//             var toUserId = 200;
//             var acceptanceToken = "valid-token-12345";

//             var transfer = new TicketTransfer
//             {
//                 Id = transferId,
//                 TicketId = ticketId,
//                 FromUserId = fromUserId,
//                 ToUserId = toUserId,
//                 IsApproved = false,
//                 AcceptanceToken = acceptanceToken,
//                 AcceptanceExpiresAt = DateTime.UtcNow.AddDays(3)
//             };

//             var ticket = new Ticket
//             {
//                 Id = ticketId,
//                 TicketCode = "TKT001",
//                 BookingId = 1,
//                 Status = TicketStatus.Valid
//             };

//             var fromUser = new User { Id = fromUserId, Email = "sender@test.com", FullName = "Sender" };
//             var toUser = new User { Id = toUserId, Email = "recipient@test.com", FullName = "Recipient" };

//             var rejectDto = new AcceptTransferDto
//             {
//                 TransferId = transferId,
//                 AcceptanceToken = acceptanceToken
//             };

//             _mockTicketTransferRepository.Setup(r => r.GetByIdAsync(transferId))
//                 .ReturnsAsync(transfer);
//             _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
//                 .ReturnsAsync(ticket);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(fromUserId))
//                 .ReturnsAsync(fromUser);
//             _mockUserRepository.Setup(r => r.GetUserByIdAsync(toUserId))
//                 .ReturnsAsync(toUser);
//             _mockTicketTransferRepository.Setup(r => r.DeleteAsync(transferId))
//                 .ReturnsAsync(true);
//             _mockEmailService.Setup(e => e.SendTicketTransferRejectedNotificationAsync(
//                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
//                 .Returns(Task.CompletedTask);
//             _mockEmailService.Setup(e => e.SendTicketTransferRejectedConfirmationAsync(
//                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
//                 .Returns(Task.CompletedTask);

//             // Act
//             var result = await _ticketService.RejectTransferAsync(rejectDto, toUserId);

//             // Assert
//             Assert.True(result);
//             _mockTicketTransferRepository.Verify(r => r.DeleteAsync(transferId), Times.Once);
//             _mockEmailService.Verify(e => e.SendTicketTransferRejectedNotificationAsync(
//                 fromUser.Email, It.IsAny<string>(), It.IsAny<string>(), "TKT001"
//             ), Times.Once);
//             _mockEmailService.Verify(e => e.SendTicketTransferRejectedConfirmationAsync(
//                 toUser.Email, It.IsAny<string>(), "TKT001"
//             ), Times.Once);
//         }

//         [Fact]
//         public async Task RejectTransfer_AlreadyAccepted_ThrowsException()
//         {
//             // Arrange
//             var transferId = 1;
//             var toUserId = 200;

//             var transfer = new TicketTransfer
//             {
//                 Id = transferId,
//                 ToUserId = toUserId,
//                 IsApproved = true, // Already accepted
//                 AcceptanceToken = "valid-token"
//             };

//             _mockTicketTransferRepository.Setup(r => r.GetByIdAsync(transferId))
//                 .ReturnsAsync(transfer);

//             var rejectDto = new AcceptTransferDto
//             {
//                 TransferId = transferId,
//                 AcceptanceToken = "valid-token"
//             };

//             // Act & Assert
//             var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
//                 _ticketService.RejectTransferAsync(rejectDto, toUserId));
            
//             Assert.Contains("This transfer has already been accepted", exception.Message);
//         }

//         #endregion

//         #region Ticket Scan Tests

//         [Fact]
//         public async Task ScanTicket_WithValidTicket_MarksAsUsed()
//         {
//             // Arrange
//             var ticketCode = "TKT001";
//             var eventId = 1;
//             var scanDto = new TicketScanDto
//             {
//                 TicketNumber = ticketCode,
//                 EventId = eventId,
//                 ScannedByUserId = 1,
//                 ScanLocation = "Main Entrance",
//                 ScanType = "Entry"
//             };

//             var ticket = new Ticket
//             {
//                 Id = 1,
//                 TicketCode = ticketCode,
//                 BookingId = 1,
//                 Status = TicketStatus.Valid
//             };

//             var booking = new Booking
//             {
//                 Id = 1,
//                 EventId = eventId,
//                 UserId = 100
//             };

//             _mockTicketRepository.Setup(r => r.GetByTicketCodeAsync(ticketCode))
//                 .ReturnsAsync(ticket);
//             _mockBookingRepository.Setup(r => r.GetByIdAsync(1))
//                 .ReturnsAsync(booking);
//             _mockTicketScanRepository.Setup(r => r.CreateAsync(It.IsAny<TicketScan>()))
//                 .ReturnsAsync(new TicketScan { Id = 1 });
//             _mockTicketRepository.Setup(r => r.UpdateAsync(It.IsAny<Ticket>()))
//                 .ReturnsAsync(ticket);
//             _mockMapper.Setup(m => m.Map<TicketDto>(It.IsAny<Ticket>()))
//                 .Returns(new TicketDto { TicketId = 1, TicketNumber = ticketCode, Status = "Used" });

//             // Act
//             var result = await _ticketService.ScanTicketAsync(scanDto);

//             // Assert
//             Assert.NotNull(result);
//             Assert.Equal(ticketCode, result.TicketNumber);
//             _mockTicketScanRepository.Verify(r => r.CreateAsync(It.Is<TicketScan>(s =>
//                 s.TicketId == 1 &&
//                 s.ScanLocation == "Main Entrance" &&
//                 s.ScanType == "Entry" &&
//                 s.IsValid == true
//             )), Times.Once);
//             _mockTicketRepository.Verify(r => r.UpdateAsync(It.Is<Ticket>(t =>
//                 t.Status == TicketStatus.Used &&
//                 t.UsedAt.HasValue
//             )), Times.Once);
//         }

//         [Fact]
//         public async Task ScanTicket_AlreadyUsed_ThrowsException()
//         {
//             // Arrange
//             var ticketCode = "TKT001";
//             var scanDto = new TicketScanDto
//             {
//                 TicketNumber = ticketCode,
//                 EventId = 1
//             };

//             var ticket = new Ticket
//             {
//                 Id = 1,
//                 TicketCode = ticketCode,
//                 BookingId = 1,
//                 Status = TicketStatus.Used, // Already used
//                 UsedAt = DateTime.UtcNow.AddHours(-1)
//             };

//             var booking = new Booking
//             {
//                 Id = 1,
//                 EventId = 1,
//                 UserId = 100
//             };

//             _mockTicketRepository.Setup(r => r.GetByTicketCodeAsync(ticketCode))
//                 .ReturnsAsync(ticket);
//             _mockBookingRepository.Setup(r => r.GetByIdAsync(1))
//                 .ReturnsAsync(booking);

//             // Act & Assert
//             var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
//                 _ticketService.ScanTicketAsync(scanDto));
            
//             Assert.Contains("Ticket has already been used", exception.Message);
//         }

//         [Fact]
//         public async Task ScanTicket_WrongEvent_ThrowsException()
//         {
//             // Arrange
//             var ticketCode = "TKT001";
//             var scanDto = new TicketScanDto
//             {
//                 TicketNumber = ticketCode,
//                 EventId = 2 // Different event
//             };

//             var ticket = new Ticket
//             {
//                 Id = 1,
//                 TicketCode = ticketCode,
//                 BookingId = 1,
//                 Status = TicketStatus.Valid
//             };

//             var booking = new Booking
//             {
//                 Id = 1,
//                 EventId = 1, // Original event
//                 UserId = 100
//             };

//             _mockTicketRepository.Setup(r => r.GetByTicketCodeAsync(ticketCode))
//                 .ReturnsAsync(ticket);
//             _mockBookingRepository.Setup(r => r.GetByIdAsync(1))
//                 .ReturnsAsync(booking);

//             // Act & Assert
//             var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
//                 _ticketService.ScanTicketAsync(scanDto));
            
//             Assert.Contains("Ticket does not belong to this event", exception.Message);
//         }

//         #endregion

//         #region Additional Tests

//         [Fact]
//         public async Task GetTransferableTickets_WithValidBooking_ReturnsOnlyValidTickets()
//         {
//             // Arrange
//             var userId = 100;
//             var bookingId = 1;

//             var booking = new Booking
//             {
//                 Id = bookingId,
//                 UserId = userId,
//                 EventId = 1
//             };

//             var tickets = new List<Ticket>
//             {
//                 new Ticket { Id = 1, TicketCode = "TKT001", Status = TicketStatus.Valid, BookingId = bookingId },
//                 new Ticket { Id = 2, TicketCode = "TKT002", Status = TicketStatus.Used, BookingId = bookingId },
//                 new Ticket { Id = 3, TicketCode = "TKT003", Status = TicketStatus.Valid, BookingId = bookingId }
//             };

//             var validTicketDtos = new List<TicketDto>
//             {
//                 new TicketDto { TicketId = 1, TicketNumber = "TKT001", Status = "Valid" },
//                 new TicketDto { TicketId = 3, TicketNumber = "TKT003", Status = "Valid" }
//             };

//             _mockBookingRepository.Setup(r => r.GetByIdAsync(bookingId))
//                 .ReturnsAsync(booking);
//             _mockTicketRepository.Setup(r => r.GetByBookingIdAsync(bookingId))
//                 .ReturnsAsync(tickets);
//             _mockMapper.Setup(m => m.Map<IEnumerable<TicketDto>>(It.IsAny<IEnumerable<Ticket>>()))
//                 .Returns(validTicketDtos);

//             // Act
//             var result = await _ticketService.GetTransferableTicketsAsync(userId, bookingId);

//             // Assert
//             Assert.NotNull(result);
//             var resultList = result.ToList();
//             Assert.Equal(2, resultList.Count);
//             Assert.All(resultList, t => Assert.Equal("Valid", t.Status));
//         }

//         [Fact]
//         public async Task GetPendingTransfers_WithValidUser_ReturnsPendingTransfers()
//         {
//             // Arrange
//             var userId = 200;

//             var transfers = new List<TicketTransfer>
//             {
//                 new TicketTransfer
//                 {
//                     Id = 1,
//                     TicketId = 1,
//                     FromUserId = 100,
//                     ToUserId = userId,
//                     IsApproved = false,
//                     TransferredAt = DateTime.UtcNow,
//                     AcceptanceExpiresAt = DateTime.UtcNow.AddDays(5),
//                     Ticket = new Ticket { TicketCode = "TKT001" },
//                     FromUser = new User { Id = 100, Email = "sender@test.com", FullName = "Sender" },
//                     ToUser = new User { Id = userId, Email = "recipient@test.com", FullName = "Recipient" }
//                 }
//             };

//             _mockTicketTransferRepository.Setup(r => r.GetPendingTransfersAsync(userId))
//                 .ReturnsAsync(transfers);

//             // Act
//             var result = await _ticketService.GetPendingTransfersAsync(userId);

//             // Assert
//             Assert.NotNull(result);
//             var resultList = result.ToList();
//             Assert.Single(resultList);
//             Assert.Equal("TKT001", resultList[0].TicketCode);
//             Assert.Equal("Sender", resultList[0].FromUserName);
//             Assert.False(resultList[0].IsApproved);
//         }

//         [Fact]
//         public async Task ValidateTicket_WithValidTicket_ReturnsTrue()
//         {
//             // Arrange
//             var ticketCode = "TKT001";
//             var eventId = 1;

//             _mockTicketRepository.Setup(r => r.IsTicketValidAsync(ticketCode, eventId))
//                 .ReturnsAsync(true);

//             // Act
//             var result = await _ticketService.ValidateTicketAsync(ticketCode, eventId);

//             // Assert
//             Assert.True(result);
//             _mockTicketRepository.Verify(r => r.IsTicketValidAsync(ticketCode, eventId), Times.Once);
//         }

//         [Fact]
//         public async Task GetUserTicketsCount_WithValidUser_ReturnsCount()
//         {
//             // Arrange
//             var userId = 100;
//             var expectedCount = 5;

//             _mockTicketRepository.Setup(r => r.CountByUserIdAsync(userId))
//                 .ReturnsAsync(expectedCount);

//             // Act
//             var result = await _ticketService.GetUserTicketsCountAsync(userId);

//             // Assert
//             Assert.Equal(expectedCount, result);
//             _mockTicketRepository.Verify(r => r.CountByUserIdAsync(userId), Times.Once);
//         }

//         #endregion
//     }
// }

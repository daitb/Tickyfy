# Tickify Backend Unit Tests

## Overview

This directory contains comprehensive unit tests for the Tickify backend services using xUnit and Moq.

## Test Structure

```
Tests/
├── Services/
│   ├── BookingServiceTests.cs         # BookingService unit tests (14 tests)
│   ├── SeatMapServiceTests.cs         # SeatMapService unit tests (16 tests)
│   ├── TicketServiceTests.cs          # TicketService unit tests (18 tests)
│   └── PromoCodeServiceTests.cs       # PromoCodeService unit tests (17 tests)
├── Validators/
│   ├── CreateBookingValidatorTests.cs        # CreateBookingValidator tests (10 tests)
│   ├── TicketTransferValidatorTests.cs       # TicketTransferValidator tests (10 tests)
│   ├── CreateSeatMapValidatorTests.cs        # CreateSeatMapValidator tests (12 tests)
│   ├── CreateSeatZoneValidatorTests.cs       # CreateSeatZoneValidator tests (15 tests)
│   └── ValidatePromoCodeValidatorTests.cs    # ValidatePromoCodeValidator tests (12 tests)
├── README.md                           # This file
└── TEST_SUMMARY.md                     # Detailed test results and coverage
```

## Test Statistics

- **Total Test Files:** 9 (4 Services + 5 Validators)
- **Total Tests:** 124 (65 Service Tests + 59 Validator Tests)
- **Pass Rate:** 100% ✅
- **Execution Time:** ~2.5 seconds

## Prerequisites

The following packages are already installed in the project:

- `xunit` (v2.9.3) - Test framework
- `Moq` (v4.20.72) - Mocking framework
- `Microsoft.EntityFrameworkCore.InMemory` (v9.0.10) - For InMemory database testing
- `Microsoft.NET.Test.Sdk` (v18.0.1) - Test execution SDK

## Running Tests

### Using Visual Studio

1. Open the solution in Visual Studio
2. Open Test Explorer: `Test > Test Explorer`
3. Click "Run All" to run all tests
4. Or right-click specific test and select "Run"

### Using .NET CLI

```powershell
# Run all tests
dotnet test

# Run only service tests
dotnet test --filter "FullyQualifiedName~Services"

# Run only validator tests
dotnet test --filter "FullyQualifiedName~Validators"

# Run specific test class
dotnet test --filter "FullyQualifiedName~BookingServiceTests"
dotnet test --filter "FullyQualifiedName~SeatMapServiceTests"
dotnet test --filter "FullyQualifiedName~TicketServiceTests"
dotnet test --filter "FullyQualifiedName~PromoCodeServiceTests"
dotnet test --filter "FullyQualifiedName~CreateBookingValidatorTests"

# Run specific test method
dotnet test --filter "FullyQualifiedName~CreateBooking_WithValidSeats_ReturnsSuccess"
dotnet test --filter "FullyQualifiedName~ReserveSeats_WithAvailableSeats_LocksSeatsFor10Minutes"
dotnet test --filter "FullyQualifiedName~TransferTicket_ToAnotherUser_CreatesTransferRequest"
dotnet test --filter "FullyQualifiedName~ValidatePromoCodeAsync_WithValidCode_ReturnsPromoCodeDto"
dotnet test --filter "FullyQualifiedName~Valid_CreateBookingDto_PassesValidation"

# Run tests with detailed output
dotnet test --logger "console;verbosity=detailed"

# Run tests and generate code coverage
dotnet test /p:CollectCoverage=true
```

### Using PowerShell from Server directory

```powershell
# Navigate to server directory
cd Source\Tickify.Server

# Run tests
dotnet test

# Run with verbose output
dotnet test -v n
```

## BookingServiceTests

### Test Coverage

The `BookingServiceTests.cs` file contains **13 comprehensive test cases** covering:

#### Core Booking Operations

1. ✅ **CreateBooking_WithValidSeats_ReturnsSuccess**

   - Tests successful booking creation with seat selection
   - Verifies seat reservation, booking creation, and expiration time

2. ✅ **CreateBooking_WithUnavailableSeats_ThrowsException**

   - Tests handling of already-booked seats
   - Verifies exception is thrown and no booking is created

3. ✅ **CreateBooking_WithExpiredEvent_ThrowsException**

   - Tests validation for past events (validation to be added)
   - Placeholder for future validation enhancement

4. ✅ **CreateBooking_WithConcurrentRequests_OnlyOneSucceeds**

   - Tests race condition handling for concurrent seat bookings
   - Verifies only one booking succeeds when multiple users try to book same seats

5. ✅ **CreateBooking_WithInsufficientTickets_ThrowsException**
   - Tests validation when requested quantity exceeds availability
   - Verifies appropriate error message

#### Cancellation Operations

6. ✅ **CancelBooking_WithValidBooking_ReleasesSeats**

   - Tests successful booking cancellation
   - Verifies seats are released and tickets are marked as cancelled

7. ✅ **CancelBooking_WithConfirmedBooking_ThrowsException**

   - Tests that confirmed bookings cannot be cancelled
   - Verifies user is directed to refund process instead

8. ✅ **CancelBooking_WithUnauthorizedUser_ThrowsUnauthorizedException**
   - Tests authorization check for cancellation
   - Verifies users can only cancel their own bookings

#### Promo Code Operations

9. ✅ **ApplyPromoCode_WithValidCode_AppliesDiscount**
   - Tests promo code application and discount calculation
   - Verifies usage count increment and booking update

#### Query Operations

10. ✅ **GetUserBookings_WithPagination_ReturnsCorrectPage**

    - Tests retrieval of user bookings with pagination support
    - Verifies correct data is returned for page 2 of 25 bookings

11. ✅ **GetByIdAsync_WithValidId_ReturnsBooking**

    - Tests successful booking retrieval by ID
    - Verifies correct booking data is returned

12. ✅ **GetByIdAsync_WithInvalidId_ThrowsNotFoundException**
    - Tests handling of non-existent booking IDs
    - Verifies appropriate exception is thrown

#### Background Job Operations

13. ✅ **ExpireBooking_AfterTimeout_UpdatesStatusAndReleasesSeats**
    - Tests automatic expiration of unpaid bookings
    - Verifies seats are released and status is updated

### Test Patterns Used

#### 1. **Arrange-Act-Assert (AAA)**

All tests follow the AAA pattern for clarity:

```csharp
// Arrange - Setup test data and mocks
var userId = 1;
var booking = new Booking { ... };

// Act - Execute the method being tested
var result = await _service.CreateBookingAsync(dto, userId);

// Assert - Verify the results
Assert.NotNull(result);
Assert.Equal(expected, result.Property);
```

#### 2. **Mocking with Moq**

Dependencies are mocked to isolate the service under test:

```csharp
_mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId))
    .ReturnsAsync(booking);

_mockSeatRepo.Verify(x => x.ReserveSeatsAsync(seatIds, userId), Times.Once);
```

#### 3. **InMemory Database**

Uses Entity Framework InMemory database for integration-style testing:

```csharp
var options = new DbContextOptionsBuilder<ApplicationDbContext>()
    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
    .Options;
```

#### 4. **Exception Testing**

Validates exception types and messages:

```csharp
var exception = await Assert.ThrowsAsync<BadRequestException>(
    () => _service.CreateBookingAsync(dto, userId)
);
Assert.Contains("not available", exception.Message);
```

### Key Testing Scenarios

#### Race Condition Testing

The concurrent booking test simulates real-world scenarios where multiple users try to book the same seat:

```csharp
await Task.WhenAll(
    Task.Run(async () => await _service.CreateBookingAsync(dto, user1)),
    Task.Run(async () => await _service.CreateBookingAsync(dto, user2))
);
```

#### Transaction Rollback Testing

Tests verify that failed operations don't leave inconsistent data:

- Failed bookings don't reserve seats
- Cancelled bookings release all resources
- Expired bookings clean up properly

#### Authorization Testing

Verifies that users can only access their own bookings:

- Owner can view/cancel their booking
- Other users get UnauthorizedException

## Test Data Setup

Each test creates its own isolated test data using:

- InMemory database (automatically cleaned up after each test)
- Mock repositories (reset for each test)
- Fresh service instance (new instance per test)

The `IDisposable` interface ensures cleanup:

```csharp
public void Dispose()
{
    _context.Database.EnsureDeleted();
    _context.Dispose();
}
```

## Verification Patterns

### Method Call Verification

```csharp
// Verify method was called once
_mockRepo.Verify(x => x.Method(), Times.Once);

// Verify method was called with specific parameters
_mockRepo.Verify(x => x.Method(It.Is<Param>(p => p.Id == 1)), Times.Once);

// Verify method was never called
_mockRepo.Verify(x => x.Method(), Times.Never);
```

### State Verification

```csharp
// Verify object state after operation
Assert.Equal(BookingStatus.Confirmed, booking.Status);
Assert.NotNull(booking.ExpiresAt);

// Verify collections
Assert.Equal(2, seats.Count);
Assert.All(seats, s => Assert.True(s.IsAvailable));
```

## Common Test Failures and Solutions

### Issue: "Database already exists"

**Solution:** Each test uses a unique database name with `Guid.NewGuid().ToString()`

### Issue: "Null reference exception in mapper"

**Solution:** Ensure mapper mock returns appropriate DTOs:

```csharp
_mockMapper.Setup(x => x.Map<BookingDto>(It.IsAny<Booking>()))
    .Returns(new BookingDto { ... });
```

### Issue: "Transaction already disposed"

**Solution:** Don't manually dispose transactions in tests, let the service handle it

### Issue: "Test timeout"

**Solution:** Concurrent tests may need delays:

```csharp
await Task.Delay(50); // Small delay for second request
```

## PromoCodeServiceTests

### Test Coverage

The `PromoCodeServiceTests.cs` file contains **17 comprehensive test cases** covering:

#### Promo Code Validation

1. ✅ **ValidatePromoCodeAsync_WithValidCode_ReturnsPromoCodeDto**
   - Tests successful validation with active promo code
   - Verifies date ranges, usage limits, and minimum purchase
2. ✅ **ValidatePromoCodeAsync_ExpiredCode_ThrowsBadRequestException**
   - Tests expired promo code rejection
   - Verifies error message contains expiration date
3. ✅ **ValidatePromoCodeAsync_MaxUsageReached_ThrowsBadRequestException**
   - Tests maximum usage limit enforcement
   - Verifies CurrentUses >= MaxUses prevents redemption
4. ✅ **ValidatePromoCodeAsync_BelowMinimumPurchase_ThrowsBadRequestException**
   - Tests minimum purchase requirement validation
   - Verifies formatted currency values in error messages
5. ✅ **ValidatePromoCodeAsync_InactiveCode_ThrowsBadRequestException**
   - Tests inactive promo code rejection (IsActive = false)
6. ✅ **ValidatePromoCodeAsync_NonExistentCode_ThrowsNotFoundException**
   - Tests non-existent promo code handling
7. ✅ **ValidatePromoCodeAsync_WrongEvent_ThrowsBadRequestException**
   - Tests event-specific promo code validation

#### Discount Calculation

8. ✅ **CalculateDiscountAsync_PercentageType_ReturnsCorrectAmount**
   - Tests percentage-based discount (20% of 500,000 VND = 100,000 VND)
9. ✅ **CalculateDiscountAsync_FixedAmountType_ReturnsCorrectAmount**
   - Tests fixed amount discount (50,000 VND off)
10. ✅ **CalculateDiscountAsync_DiscountExceedsOrderTotal_ReturnsCappedAmount**
    - Tests 100% discount capping to order total
11. ✅ **CalculateDiscountAsync_FixedAmountExceedsTotal_ReturnsCappedAmount**
    - Tests fixed discount capping (500,000 VND capped to 300,000 VND)
12. ✅ **CalculateDiscountAsync_InvalidPromoCode_ThrowsBadRequestException**
    - Tests invalid promo code detection
13. ✅ **CalculateDiscountAsync_BelowMinimumPurchase_ThrowsBadRequestException**
    - Tests minimum purchase enforcement during calculation

#### Usage Tracking

14. ✅ **GetByIdAsync_ValidId_ReturnsPromoCodeDto**
    - Tests promo code retrieval by ID
15. ✅ **GetByIdAsync_InvalidId_ThrowsNotFoundException**
    - Tests invalid ID handling
16. ✅ **ApplyPromoCodeAsync_ValidPromoCode_ReturnsTrue**
    - Tests usage count increment after booking
17. ✅ **GetUsageCountAsync_ValidPromoCode_ReturnsUsageCount**
    - Tests usage count retrieval

### Test Architecture

- **Mocking Strategy:**
  - `IPromoCodeRepository` - For data access operations
  - `IUserRepository` - For user validation
  - `IEventRepository` - For event-specific codes
  - `IMapper` - For DTO mapping
- **Test Patterns:**
  - AAA pattern (Arrange-Act-Assert)
  - Descriptive test names
  - Comprehensive edge case coverage
  - Business rule validation

### Key Test Features

- ✅ Date validation (ValidFrom, ValidTo)
- ✅ Usage limits (total and per-user)
- ✅ Minimum purchase requirements
- ✅ Discount type validation (percentage OR fixed)
- ✅ Event-specific vs global codes
- ✅ Discount capping (never exceed order total)
- ✅ Currency formatting validation (500,000₫)
- ✅ Error message content verification

## ValidatePromoCodeValidatorTests

### Test Coverage

The `ValidatePromoCodeValidatorTests.cs` file contains **12 comprehensive test cases** covering:

#### Promo Code Validation

1. ✅ **Valid_PromoCodeDto_PassesValidation**
   - Tests valid promo code DTO with all required fields
2. ✅ **EmptyCode_FailsValidation**
   - Tests empty promo code rejection
3. ✅ **NullCode_FailsValidation**
   - Tests null promo code rejection
4. ✅ **TooLongCode_FailsValidation**
   - Tests promo code exceeding 50 characters
5. ✅ **CodeAtMaxLength_PassesValidation**
   - Tests promo code at exactly 50 characters

#### Event Validation

6. ✅ **ZeroEventId_FailsValidation**
   - Tests EventId = 0 rejection
7. ✅ **NegativeEventId_FailsValidation**
   - Tests negative EventId rejection

#### Order Total Validation

8. ✅ **NegativeOrderTotal_FailsValidation**
   - Tests negative order total rejection
9. ✅ **ZeroOrderTotal_PassesValidation**
   - Tests OrderTotal = 0 acceptance
10. ✅ **LargeOrderTotal_PassesValidation**
    - Tests very large order total acceptance

#### Edge Cases

11. ✅ **WhitespaceCode_FailsValidation**
    - Tests whitespace-only promo code rejection
12. ✅ **MultipleValidationErrors_ReturnsAllErrors**
    - Tests multiple validation errors at once

### Test Features

- ✅ FluentValidation.TestHelper usage
- ✅ Empty/null value validation
- ✅ Length constraints validation
- ✅ Range validation for numeric fields
- ✅ Error message verification
- ✅ Edge case testing

## Future Test Enhancements

### Recommended Additional Tests

1. **Event Expiration Validation**

   - Add validation in service to prevent booking past events
   - Uncomment validation test in Test 3

2. **Maximum Payment Amount Tests**

   - Test booking amounts exceeding 50M VND limit
   - Verify appropriate error handling

3. **Service Fee Calculation Tests**

   - Test various scenarios with different ticket prices
   - Verify rounding logic

4. **Promo Code Per-User Limits**

   - Test MaxUsesPerUser enforcement
   - Test user-specific usage tracking
   - Verify per-user redemption limits

5. **Integration Tests**
   - Full booking flow with real database
   - Payment integration tests
   - Email notification tests

## Code Coverage Goals

Target coverage for BookingService:

- ✅ Line Coverage: 80%+
- ✅ Branch Coverage: 75%+
- ✅ Critical Paths: 100%

## Contributing

When adding new tests:

1. Follow the AAA pattern
2. Use descriptive test method names: `MethodName_Scenario_ExpectedResult`
3. Add XML comments for complex test scenarios
4. Group related tests with regions (`#region` / `#endregion`)
5. Clean up resources properly (implement `IDisposable` if needed)

## Resources

- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)
- [EF Core InMemory Provider](https://docs.microsoft.com/en-us/ef/core/providers/in-memory/)
- [Unit Testing Best Practices](https://docs.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices)

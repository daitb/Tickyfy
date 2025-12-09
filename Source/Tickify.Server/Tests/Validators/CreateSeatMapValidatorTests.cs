// using FluentValidation.TestHelper;
// using Tickify.DTOs.SeatMap;
// using Xunit;

// namespace Tickify.Tests.Validators;

// /// <summary>
// /// Unit tests for CreateSeatMapValidator to ensure proper validation of seat map creation requests
// /// </summary>
// public class CreateSeatMapValidatorTests
// {
//     private readonly CreateSeatMapValidator _validator;

//     public CreateSeatMapValidatorTests()
//     {
//         _validator = new CreateSeatMapValidator();
//     }

//     /// <summary>
//     /// Test 1: Validates that a properly formed CreateSeatMapDto passes all validation rules
//     /// </summary>
//     [Fact]
//     public void Valid_SeatMapDto_PassesValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             Description = "Primary seating arrangement",
//             TotalRows = 20,
//             TotalColumns = 30,
//             LayoutConfig = "{\"zones\": []}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldNotHaveAnyValidationErrors();
//     }

//     /// <summary>
//     /// Test 2: Validates that EventId = 0 fails validation
//     /// </summary>
//     [Fact]
//     public void EmptyEventId_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 0,
//             Name = "Main Hall Seating",
//             TotalRows = 20,
//             TotalColumns = 30,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.EventId)
//             .WithErrorMessage("EventId phải lớn hơn 0");
//     }

//     /// <summary>
//     /// Test 3: Validates that negative EventId fails validation
//     /// </summary>
//     [Fact]
//     public void NegativeEventId_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = -1,
//             Name = "Main Hall Seating",
//             TotalRows = 20,
//             TotalColumns = 30,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.EventId)
//             .WithErrorMessage("EventId phải lớn hơn 0");
//     }

//     /// <summary>
//     /// Test 4: Validates that TotalRows = 0 fails validation
//     /// </summary>
//     [Fact]
//     public void InvalidRowCount_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             TotalRows = 0,
//             TotalColumns = 30,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.TotalRows)
//             .WithErrorMessage("Số hàng phải lớn hơn 0");
//     }

//     /// <summary>
//     /// Test 5: Validates that TotalColumns = 0 fails validation
//     /// </summary>
//     [Fact]
//     public void InvalidColumnCount_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             TotalRows = 20,
//             TotalColumns = 0,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.TotalColumns)
//             .WithErrorMessage("Số cột phải lớn hơn 0");
//     }

//     /// <summary>
//     /// Test 6: Validates that negative TotalRows fails validation
//     /// </summary>
//     [Fact]
//     public void NegativeRowCount_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             TotalRows = -5,
//             TotalColumns = 30,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.TotalRows)
//             .WithErrorMessage("Số hàng phải lớn hơn 0");
//     }

//     /// <summary>
//     /// Test 7: Validates that negative TotalColumns fails validation
//     /// </summary>
//     [Fact]
//     public void NegativeColumnCount_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             TotalRows = 20,
//             TotalColumns = -10,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.TotalColumns)
//             .WithErrorMessage("Số cột phải lớn hơn 0");
//     }

//     /// <summary>
//     /// Test 8: Validates that empty Name fails validation
//     /// </summary>
//     [Fact]
//     public void EmptyName_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "",
//             TotalRows = 20,
//             TotalColumns = 30,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.Name)
//             .WithErrorMessage("Tên sơ đồ chỗ ngồi là bắt buộc");
//     }

//     /// <summary>
//     /// Test 9: Validates that Name longer than 200 characters fails validation
//     /// </summary>
//     [Fact]
//     public void TooLongName_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = new string('A', 201), // 201 characters
//             TotalRows = 20,
//             TotalColumns = 30,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.Name)
//             .WithErrorMessage("Tên sơ đồ chỗ ngồi không được dài quá 200 ký tự");
//     }

//     /// <summary>
//     /// Test 10: Validates that empty LayoutConfig fails validation
//     /// </summary>
//     [Fact]
//     public void EmptyLayoutConfig_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             TotalRows = 20,
//             TotalColumns = 30,
//             LayoutConfig = ""
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.LayoutConfig)
//             .WithErrorMessage("Cấu hình layout là bắt buộc");
//     }

//     /// <summary>
//     /// Test 11: Validates that TotalRows > 100 fails validation
//     /// </summary>
//     [Fact]
//     public void ExcessiveRowCount_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             TotalRows = 101, // Exceeds maximum of 100
//             TotalColumns = 30,
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.TotalRows)
//             .WithErrorMessage("Số hàng không được vượt quá 100");
//     }

//     /// <summary>
//     /// Test 12: Validates that TotalColumns > 100 fails validation
//     /// </summary>
//     [Fact]
//     public void ExcessiveColumnCount_FailsValidation()
//     {
//         // Arrange
//         var dto = new CreateSeatMapDto
//         {
//             EventId = 1,
//             Name = "Main Hall Seating",
//             TotalRows = 20,
//             TotalColumns = 101, // Exceeds maximum of 100
//             LayoutConfig = "{}"
//         };

//         // Act
//         var result = _validator.TestValidate(dto);

//         // Assert
//         result.ShouldHaveValidationErrorFor(x => x.TotalColumns)
//             .WithErrorMessage("Số cột không được vượt quá 100");
//     }
// }

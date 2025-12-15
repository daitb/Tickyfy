using Microsoft.AspNetCore.Mvc;
using Tickify.Interfaces;

namespace Tickify.Controllers;

[ApiController]
[Route("api/images")]
public class ImageController : ControllerBase
{
    private readonly IAzureStorageService _azureStorageService;
    private readonly ILogger<ImageController> _logger;

    public ImageController(IAzureStorageService azureStorageService, ILogger<ImageController> logger)
    {
        _azureStorageService = azureStorageService;
        _logger = logger;
    }

    /// <summary>
    /// Upload image to Azure Storage (Private Container)
    /// </summary>
    /// <param name="file">Image file</param>
    /// <returns>Blob name</returns>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(ImageUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Invalid file type. Only images are allowed." });
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size exceeds 5MB limit" });
            }

            // Upload to Azure Storage
            var blobName = await _azureStorageService.UploadFileAsync(file);

            // Generate SAS URL (valid for 24 hours)
            var imageUrl = await _azureStorageService.GetBlobUrlWithSasAsync(blobName);

            return Ok(new ImageUploadResponse
            {
                BlobName = blobName,
                ImageUrl = imageUrl,
                FileName = file.FileName,
                FileSize = file.Length,
                ContentType = file.ContentType,
                Message = "Image uploaded successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            return StatusCode(500, new { message = "An error occurred while uploading the image" });
        }
    }

    /// <summary>
    /// Get image URL with SAS token
    /// </summary>
    /// <param name="blobName">Blob name from database</param>
    /// <param name="expiryHours">Token validity in hours (default: 24)</param>
    /// <returns>Full URL with SAS token</returns>
    [HttpGet("{blobName}")]
    [ProducesResponseType(typeof(ImageUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetImageUrl(string blobName, [FromQuery] int expiryHours = 24)
    {
        try
        {
            var imageUrl = await _azureStorageService.GetBlobUrlWithSasAsync(blobName, expiryHours: expiryHours);
            
            return Ok(new ImageUrlResponse
            {
                BlobName = blobName,
                ImageUrl = imageUrl,
                ExpiresAt = DateTimeOffset.UtcNow.AddHours(expiryHours)
            });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Image not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting image URL");
            return StatusCode(500, new { message = "An error occurred while getting the image URL" });
        }
    }

    /// <summary>
    /// Delete image from Azure Storage
    /// </summary>
    /// <param name="blobName">Blob name to delete</param>
    [HttpDelete("{blobName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImage(string blobName)
    {
        try
        {
            var deleted = await _azureStorageService.DeleteFileAsync(blobName);
            
            if (!deleted)
            {
                return NotFound(new { message = "Image not found" });
            }

            return Ok(new { message = "Image deleted successfully", blobName });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image");
            return StatusCode(500, new { message = "An error occurred while deleting the image" });
        }
    }
}

// Response DTOs
public class ImageUploadResponse
{
    public string BlobName { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class ImageUrlResponse
{
    public string BlobName { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
}

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Tickify.Interfaces;

namespace Tickify.Services;

public class AzureStorageService : IAzureStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _defaultContainerName;
    private readonly ILogger<AzureStorageService> _logger;

    public AzureStorageService(IConfiguration configuration, ILogger<AzureStorageService> logger)
    {
        var connectionString = configuration["Azure:StorageAccount:ConnectionString"];

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Azure Storage connection string is not configured in appsettings.json");
        }

        _blobServiceClient = new BlobServiceClient(connectionString);
        _defaultContainerName = configuration["Azure:StorageAccount:ContainerName"] ?? "event-images";
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string? containerName = null)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is empty or null");
            }

            var container = containerName ?? _defaultContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(container);

            await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

            var fileExtension = Path.GetExtension(file.FileName);
            var blobName = $"{Guid.NewGuid()}{fileExtension}";

            var blobClient = containerClient.GetBlobClient(blobName);

            var blobHttpHeaders = new BlobHttpHeaders
            {
                ContentType = GetContentType(fileExtension)
            };

            await using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobUploadOptions
            {
                HttpHeaders = blobHttpHeaders
            });

            _logger.LogInformation("File uploaded successfully: {BlobName}", blobName);

            return blobName;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to Azure Storage");
            throw;
        }
    }

    public async Task<string> GetBlobUrlWithSasAsync(string blobName, string? containerName = null, int expiryHours = 24)
    {
        try
        {
            var container = containerName ?? _defaultContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(container);
            var blobClient = containerClient.GetBlobClient(blobName);

            if (!await blobClient.ExistsAsync())
            {
                throw new FileNotFoundException($"Blob not found: {blobName}");
            }

            // Generate SAS token
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = container,
                BlobName = blobName,
                Resource = "b", // "b" for blob
                StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
                ExpiresOn = DateTimeOffset.UtcNow.AddHours(expiryHours)
            };

            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            // Generate URI with SAS token
            var sasUri = blobClient.GenerateSasUri(sasBuilder);

            return sasUri.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating SAS URL for blob: {BlobName}", blobName);
            throw;
        }
    }

    public async Task<bool> DeleteFileAsync(string blobName, string? containerName = null)
    {
        try
        {
            var container = containerName ?? _defaultContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(container);
            var blobClient = containerClient.GetBlobClient(blobName);

            var result = await blobClient.DeleteIfExistsAsync();

            if (result.Value)
            {
                _logger.LogInformation("Blob deleted successfully: {BlobName}", blobName);
            }
            else
            {
                _logger.LogWarning("Blob not found for deletion: {BlobName}", blobName);
            }

            return result.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting blob: {BlobName}", blobName);
            throw;
        }
    }

    private static string GetContentType(string fileExtension)
    {
        return fileExtension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".svg" => "image/svg+xml",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
    }
}

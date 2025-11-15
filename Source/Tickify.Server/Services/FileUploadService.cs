using Tickify.Interfaces;
using Tickify.Interfaces.Services;

namespace Tickify.Services;

public class FileUploadService : IFileUploadService
{
    private readonly IAzureStorageService _azureStorageService;
    private readonly ILogger<FileUploadService> _logger;

    public FileUploadService(
        IAzureStorageService azureStorageService,
        ILogger<FileUploadService> logger)
    {
        _azureStorageService = azureStorageService;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string containerName, string contentType)
    {
        try
        {
            // Convert Stream to IFormFile
            var formFile = new FormFile(fileStream, 0, fileStream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };

            // Upload to Azure Blob Storage
            var blobName = await _azureStorageService.UploadFileAsync(formFile, containerName);

            // Get the full URL with SAS token
            var fileUrl = await _azureStorageService.GetBlobUrlWithSasAsync(blobName, containerName);

            _logger.LogInformation("File uploaded successfully: {FileName} to container {Container}", 
                fileName, containerName);

            return fileUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file {FileName} to container {Container}", 
                fileName, containerName);
            throw;
        }
    }

    public async Task DeleteFileAsync(string fileUrl, string containerName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileUrl))
                return;

            // Extract blob name from URL (remove query string if exists)
            var uri = new Uri(fileUrl);
            var blobName = uri.Segments[^1].Split('?')[0];

            await _azureStorageService.DeleteFileAsync(blobName, containerName);

            _logger.LogInformation("File deleted successfully: {BlobName} from container {Container}", 
                blobName, containerName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {FileUrl} from container {Container}", 
                fileUrl, containerName);
            throw;
        }
    }
}

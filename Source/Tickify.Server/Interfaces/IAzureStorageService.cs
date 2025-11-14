namespace Tickify.Interfaces;

public interface IAzureStorageService
{
    /// <summary>
    /// Upload file to Azure Blob Storage (private container)
    /// </summary>
    /// <param name="file">File to upload</param>
    /// <param name="containerName">Container name (default: event-images)</param>
    /// <returns>Blob name (not full URL)</returns>
    Task<string> UploadFileAsync(IFormFile file, string? containerName = null);

    /// <summary>
    /// Get blob URL with SAS token (temporary access)
    /// </summary>
    /// <param name="blobName">Name of the blob</param>
    /// <param name="containerName">Container name</param>
    /// <param name="expiryHours">Token valid hours (default: 24h)</param>
    /// <returns>Full URL with SAS token</returns>
    Task<string> GetBlobUrlWithSasAsync(string blobName, string? containerName = null, int expiryHours = 24);

    /// <summary>
    /// Delete blob from storage
    /// </summary>
    Task<bool> DeleteFileAsync(string blobName, string? containerName = null);
}

namespace Tickify.Interfaces.Services;

public interface IFileUploadService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string containerName, string contentType);
    Task DeleteFileAsync(string fileUrl, string containerName);
}

using MyJobBoard.Application.Common.Interfaces;

namespace MyJobBoard.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _baseUploadPath;

    public FileStorageService(string? customUploadPath = null)
    {
        _baseUploadPath = customUploadPath ?? Path.Combine(AppContext.BaseDirectory, "Uploads");
        if (!Directory.Exists(_baseUploadPath))
        {
            Directory.CreateDirectory(_baseUploadPath);
        }
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(_baseUploadPath, uniqueFileName);

        using (var output = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(output, cancellationToken);
        }

        return uniqueFileName;
    }

    public Task<(Stream Stream, string ContentType, string FileName)?> GetFileAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_baseUploadPath, relativePath);
        if (!File.Exists(fullPath))
        {
            return Task.FromResult<(Stream Stream, string ContentType, string FileName)?>(null);
        }

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var contentType = GetContentType(fullPath);
        var originalFileName = Path.GetFileName(fullPath);
        if (originalFileName.Contains('_'))
        {
            originalFileName = originalFileName.Substring(originalFileName.IndexOf('_') + 1);
        }

        return Task.FromResult<(Stream Stream, string ContentType, string FileName)?>((stream, contentType, originalFileName));
    }

    public Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_baseUploadPath, relativePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    private static string GetContentType(string path)
    {
        var extension = Path.GetExtension(path).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".txt" => "text/plain",
            _ => "application/octet-stream"
        };
    }
}

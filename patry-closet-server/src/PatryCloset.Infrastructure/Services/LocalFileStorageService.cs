using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;

namespace PatryCloset.Infrastructure.Services;

/// <summary>
/// Local file-system storage for development. Saves files under wwwroot/uploads/{folder}/.
/// </summary>
public sealed class LocalFileStorageService : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif" };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private readonly string _webRootPath;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IWebHostEnvironment environment, ILogger<LocalFileStorageService> logger)
    {
        _webRootPath = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        _logger = logger;
    }

    public async Task<string> UploadAsync(
        Stream fileStream, string fileName, string contentType, string folder = "products", CancellationToken ct = default)
    {
        ValidateFile(fileName, fileStream.Length);

        var extension = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid()}{extension}";
        var directoryPath = Path.Combine(_webRootPath, "uploads", folder);

        Directory.CreateDirectory(directoryPath);

        var filePath = Path.Combine(directoryPath, uniqueName);

        await using var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write);
        await fileStream.CopyToAsync(fs, ct);

        var relativeUrl = $"/uploads/{folder}/{uniqueName}";
        _logger.LogInformation("File uploaded locally: {Url}", relativeUrl);
        return relativeUrl;
    }

    public Task DeleteAsync(string fileUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return Task.CompletedTask;

        // Convert relative URL to file path: /uploads/products/file.jpg → wwwroot/uploads/products/file.jpg
        var relativePath = fileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var filePath = Path.Combine(_webRootPath, relativePath);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation("File deleted locally: {Url}", fileUrl);
        }
        else
        {
            _logger.LogWarning("File not found for deletion: {Url}", fileUrl);
        }

        return Task.CompletedTask;
    }

    public Task<string> GetSignedUrlAsync(string fileUrl, TimeSpan expiry, CancellationToken ct = default)
    {
        // No signing needed in local development — return as-is
        return Task.FromResult(fileUrl);
    }

    private static void ValidateFile(string fileName, long fileSize)
    {
        var extension = Path.GetExtension(fileName);

        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            throw new InvalidOperationException(
                $"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", AllowedExtensions)}");

        if (fileSize > MaxFileSizeBytes)
            throw new InvalidOperationException(
                $"File size ({fileSize / (1024 * 1024.0):F1} MB) exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");
    }
}

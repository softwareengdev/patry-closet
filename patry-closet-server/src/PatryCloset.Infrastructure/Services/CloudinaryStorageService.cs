using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Infrastructure.Configuration;

namespace PatryCloset.Infrastructure.Services;

/// <summary>
/// Cloudinary-backed file storage for production.
/// Uploads with auto quality/format optimization and folder organization.
/// </summary>
public sealed class CloudinaryStorageService : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif" };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private readonly Cloudinary _cloudinary;
    private readonly CloudinarySettings _settings;
    private readonly ILogger<CloudinaryStorageService> _logger;

    public CloudinaryStorageService(IOptions<CloudinarySettings> options, ILogger<CloudinaryStorageService> logger)
    {
        _settings = options.Value;
        _logger = logger;

        var account = new Account(_settings.CloudName, _settings.ApiKey, _settings.ApiSecret);
        _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
    }

    public async Task<string> UploadAsync(
        Stream fileStream, string fileName, string contentType, string folder = "products", CancellationToken ct = default)
    {
        ValidateFile(fileName, fileStream.Length);

        var publicId = $"{_settings.DefaultFolder}/{folder}/{Guid.NewGuid()}";

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            PublicId = publicId,
            Overwrite = false,
            // Auto quality and format optimization
            Transformation = new Transformation().Quality("auto").FetchFormat("auto"),
        };

        var result = await _cloudinary.UploadAsync(uploadParams, ct);

        if (result.Error is not null)
        {
            _logger.LogError("Cloudinary upload failed: {Error}", result.Error.Message);
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
        }

        _logger.LogInformation("File uploaded to Cloudinary: {PublicId} → {Url}", result.PublicId, result.SecureUrl);
        return result.SecureUrl.ToString();
    }

    public async Task DeleteAsync(string fileUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return;

        var publicId = ExtractPublicId(fileUrl);
        if (string.IsNullOrEmpty(publicId))
        {
            _logger.LogWarning("Could not extract public_id from URL: {Url}", fileUrl);
            return;
        }

        var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));

        if (result.Result == "ok")
            _logger.LogInformation("File deleted from Cloudinary: {PublicId}", publicId);
        else
            _logger.LogWarning("Cloudinary deletion returned '{Result}' for {PublicId}", result.Result, publicId);
    }

    public Task<string> GetSignedUrlAsync(string fileUrl, TimeSpan expiry, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return Task.FromResult(string.Empty);

        var publicId = ExtractPublicId(fileUrl);
        if (string.IsNullOrEmpty(publicId))
            return Task.FromResult(fileUrl);

        var expiresAt = DateTimeOffset.UtcNow.Add(expiry).ToUnixTimeSeconds();

        var signedUrl = _cloudinary.Api.UrlImgUp
            .Signed(true)
            .Transform(new Transformation().Quality("auto").FetchFormat("auto"))
            .BuildUrl(publicId)
            + $"?_a={expiresAt}";

        return Task.FromResult(signedUrl);
    }

    /// <summary>
    /// Extracts the Cloudinary public_id from a secure URL.
    /// Example: https://res.cloudinary.com/{cloud}/image/upload/v1234/patrycloset/products/guid.jpg → patrycloset/products/guid
    /// </summary>
    private static string? ExtractPublicId(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return null;

        var path = uri.AbsolutePath; // /image/upload/v1234/patrycloset/products/guid.jpg

        // Find the segment after "upload/vNNNN/"
        const string uploadSegment = "/upload/";
        var uploadIdx = path.IndexOf(uploadSegment, StringComparison.OrdinalIgnoreCase);
        if (uploadIdx < 0)
            return null;

        var afterUpload = path[(uploadIdx + uploadSegment.Length)..];

        // Skip version segment (e.g. "v1234/")
        if (afterUpload.StartsWith('v') && afterUpload.Contains('/'))
        {
            var versionEnd = afterUpload.IndexOf('/');
            if (afterUpload[1..versionEnd].All(char.IsDigit))
                afterUpload = afterUpload[(versionEnd + 1)..];
        }

        // Remove file extension
        var dotIdx = afterUpload.LastIndexOf('.');
        return dotIdx > 0 ? afterUpload[..dotIdx] : afterUpload;
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

namespace PatryCloset.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, string folder = "products", CancellationToken ct = default);
    Task DeleteAsync(string fileUrl, CancellationToken ct = default);
    Task<string> GetSignedUrlAsync(string fileUrl, TimeSpan expiry, CancellationToken ct = default);
}

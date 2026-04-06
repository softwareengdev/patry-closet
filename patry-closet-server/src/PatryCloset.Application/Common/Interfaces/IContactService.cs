using PatryCloset.Application.Features.Contact.DTOs;

namespace PatryCloset.Application.Common.Interfaces;

public interface IContactService
{
    Task<ContactResponse> SubmitContactAsync(
        string name, string email, string? phone, string subject, string message,
        string? recaptchaToken, string? ipAddress, string? userAgent, string? userId,
        List<string>? attachmentUrls, CancellationToken ct = default);
}

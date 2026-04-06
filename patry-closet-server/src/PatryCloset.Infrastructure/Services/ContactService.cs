using MediatR;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Features.Contact.Commands;
using PatryCloset.Application.Features.Contact.DTOs;

namespace PatryCloset.Infrastructure.Services;

public sealed class ContactService(ISender mediator, ILogger<ContactService> logger) : IContactService
{
    public async Task<ContactResponse> SubmitContactAsync(
        string name, string email, string? phone, string subject, string message,
        string? recaptchaToken, string? ipAddress, string? userAgent, string? userId,
        List<string>? attachmentUrls, CancellationToken ct = default)
    {
        var command = new SubmitContactCommand(
            name, email, phone, subject, message,
            recaptchaToken, ipAddress, userAgent, userId, attachmentUrls);

        var result = await mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            logger.LogWarning("Contact submission failed: {Error}", result.Error);
            throw new InvalidOperationException(result.Error);
        }

        return result.Value!;
    }
}

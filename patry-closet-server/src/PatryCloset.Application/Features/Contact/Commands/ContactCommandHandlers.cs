using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Contact.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Contact.Commands;

public sealed class SubmitContactCommandHandler(
    IRepository<ContactMessage> contactRepo,
    IUnitOfWork unitOfWork,
    ILogger<SubmitContactCommandHandler> logger)
    : IRequestHandler<SubmitContactCommand, Result<ContactResponse>>
{
    public async Task<Result<ContactResponse>> Handle(SubmitContactCommand request, CancellationToken ct)
    {
        var ticketId = $"PC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var entity = new ContactMessage
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Subject = request.Subject,
            Message = request.Message,
            RecaptchaToken = request.RecaptchaToken,
            TicketId = ticketId,
            Status = "new",
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            UserId = request.UserId,
            Attachments = request.AttachmentUrls is { Count: > 0 }
                ? JsonSerializer.Serialize(request.AttachmentUrls)
                : null,
        };

        await contactRepo.AddAsync(entity, ct);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Contact form submitted: Ticket {TicketId} from {Email} (Subject: {Subject})",
            ticketId, request.Email, request.Subject);

        return Result<ContactResponse>.Success(new ContactResponse
        {
            Success = true,
            TicketId = ticketId,
        });
    }
}

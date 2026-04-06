using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Infrastructure.Services;

public sealed class NotificationService(
    IRepository<Notification> notificationRepo,
    IUnitOfWork unitOfWork,
    ILogger<NotificationService> logger) : INotificationService
{
    public async Task CreateNotificationAsync(
        string userId, string type, string title, string message,
        string? data = null, string? actionUrl = null,
        CancellationToken ct = default)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            Data = data,
            ActionUrl = actionUrl,
            Read = false,
        };

        await notificationRepo.AddAsync(notification, ct);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Notification created for user {UserId}: [{Type}] {Title}",
            userId, type, title);
    }
}

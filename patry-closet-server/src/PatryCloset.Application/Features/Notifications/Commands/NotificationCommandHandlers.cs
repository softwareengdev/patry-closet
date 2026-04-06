using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Models;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Notifications.Commands;

// ─── Mark single notification as read ───

public sealed class MarkNotificationReadCommandHandler(
    IRepository<Notification> notificationRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<MarkNotificationReadCommand, Result>
{
    public async Task<Result> Handle(MarkNotificationReadCommand request, CancellationToken ct)
    {
        var notification = await notificationRepo.AsQueryable()
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == request.UserId, ct);

        if (notification is null)
            return Result.Failure("Notificación no encontrada");

        if (!notification.Read)
        {
            notification.Read = true;
            notification.ReadAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(ct);
        }

        return Result.Success();
    }
}

// ─── Mark all notifications as read ───

public sealed class MarkAllNotificationsReadCommandHandler(
    IRepository<Notification> notificationRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<MarkAllNotificationsReadCommand, Result>
{
    public async Task<Result> Handle(MarkAllNotificationsReadCommand request, CancellationToken ct)
    {
        var unread = await notificationRepo.AsQueryable()
            .Where(n => n.UserId == request.UserId && !n.Read)
            .ToListAsync(ct);

        if (unread.Count == 0)
            return Result.Success();

        var now = DateTime.UtcNow;
        foreach (var notification in unread)
        {
            notification.Read = true;
            notification.ReadAt = now;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ─── Delete notification ───

public sealed class DeleteNotificationCommandHandler(
    IRepository<Notification> notificationRepo,
    IUnitOfWork unitOfWork,
    ILogger<DeleteNotificationCommandHandler> logger)
    : IRequestHandler<DeleteNotificationCommand, Result>
{
    public async Task<Result> Handle(DeleteNotificationCommand request, CancellationToken ct)
    {
        var notification = await notificationRepo.AsQueryable()
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == request.UserId, ct);

        if (notification is null)
            return Result.Failure("Notificación no encontrada");

        await notificationRepo.DeleteAsync(notification, ct);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Notification {NotificationId} deleted by user {UserId}",
            request.NotificationId, request.UserId);

        return Result.Success();
    }
}

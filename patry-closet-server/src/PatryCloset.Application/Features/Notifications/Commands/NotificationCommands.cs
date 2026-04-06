using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;

namespace PatryCloset.Application.Features.Notifications.Commands;

// ─── Mark single notification as read ───

public sealed record MarkNotificationReadCommand(Guid NotificationId, string UserId)
    : IRequest<Result>;

public sealed class MarkNotificationReadCommandValidator : AbstractValidator<MarkNotificationReadCommand>
{
    public MarkNotificationReadCommandValidator()
    {
        RuleFor(x => x.NotificationId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

// ─── Mark all notifications as read ───

public sealed record MarkAllNotificationsReadCommand(string UserId)
    : IRequest<Result>;

public sealed class MarkAllNotificationsReadCommandValidator : AbstractValidator<MarkAllNotificationsReadCommand>
{
    public MarkAllNotificationsReadCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

// ─── Delete notification ───

public sealed record DeleteNotificationCommand(Guid NotificationId, string UserId)
    : IRequest<Result>;

public sealed class DeleteNotificationCommandValidator : AbstractValidator<DeleteNotificationCommand>
{
    public DeleteNotificationCommandValidator()
    {
        RuleFor(x => x.NotificationId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Notifications.DTOs;

namespace PatryCloset.Application.Features.Notifications.Queries;

public sealed record GetUserNotificationsQuery(string UserId)
    : IRequest<Result<NotificationListResponse>>;

public sealed class GetUserNotificationsQueryValidator : AbstractValidator<GetUserNotificationsQuery>
{
    public GetUserNotificationsQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

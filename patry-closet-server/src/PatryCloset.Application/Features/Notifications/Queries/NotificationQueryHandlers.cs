using MediatR;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Notifications.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Notifications.Queries;

public sealed class GetUserNotificationsQueryHandler(
    IRepository<Notification> notificationRepo)
    : IRequestHandler<GetUserNotificationsQuery, Result<NotificationListResponse>>
{
    public async Task<Result<NotificationListResponse>> Handle(
        GetUserNotificationsQuery request, CancellationToken ct)
    {
        var query = notificationRepo.AsQueryable()
            .Where(n => n.UserId == request.UserId);

        var total = await query.CountAsync(ct);
        var unread = await query.CountAsync(n => !n.Read, ct);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .AsNoTracking()
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                Read = n.Read,
                CreatedAt = n.CreatedAt,
                Data = n.Data,
                ActionUrl = n.ActionUrl,
            })
            .ToListAsync(ct);

        return Result<NotificationListResponse>.Success(new NotificationListResponse
        {
            Items = items,
            Total = total,
            Unread = unread,
        });
    }
}

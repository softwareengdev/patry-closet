using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Notifications.Commands;
using PatryCloset.Application.Features.Notifications.DTOs;
using PatryCloset.Application.Features.Notifications.Queries;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/notifications")]
[Produces("application/json")]
[Authorize]
public sealed class NotificationsController(ISender mediator) : ControllerBase
{
    /// <summary>Get all notifications for the current user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<NotificationListResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(new GetUserNotificationsQuery(userId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<NotificationListResponse>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Mark a notification as read.</summary>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(new MarkNotificationReadCommand(id, userId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Notificación marcada como leída"))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Mark all notifications as read.</summary>
    [HttpPost("read-all")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(new MarkAllNotificationsReadCommand(userId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Todas las notificaciones marcadas como leídas"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Delete a notification.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(new DeleteNotificationCommand(id, userId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Notificación eliminada"))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }
}

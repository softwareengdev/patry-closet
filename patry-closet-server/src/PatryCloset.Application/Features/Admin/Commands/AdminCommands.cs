using MediatR;
using PatryCloset.Application.Common.Models;

namespace PatryCloset.Application.Features.Admin.Commands;

public sealed record AdminUpdateOrderStatusCommand(
    Guid OrderId, string Status, string? TrackingNumber = null, string? Notes = null)
    : IRequest<Result<bool>>;

public sealed record UpdateUserRoleCommand(string UserId, string Role)
    : IRequest<Result<bool>>;

public sealed record ToggleUserLockCommand(string UserId, bool Lock)
    : IRequest<Result<bool>>;

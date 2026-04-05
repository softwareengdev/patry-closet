using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Admin.Commands;

public sealed class AdminUpdateOrderStatusHandler
    : IRequestHandler<AdminUpdateOrderStatusCommand, Result<bool>>
{
    private readonly IRepository<Order> _orders;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AdminUpdateOrderStatusHandler> _logger;

    public AdminUpdateOrderStatusHandler(
        IRepository<Order> orders,
        IUnitOfWork unitOfWork,
        ILogger<AdminUpdateOrderStatusHandler> logger)
    {
        _orders = orders;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(AdminUpdateOrderStatusCommand request, CancellationToken ct)
    {
        var order = await _orders.AsQueryable()
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);

        if (order is null)
            return Result<bool>.Failure("Order not found");

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            return Result<bool>.Failure($"Invalid status: {request.Status}");

        var oldStatus = order.Status;
        order.Status = newStatus;

        if (!string.IsNullOrEmpty(request.TrackingNumber))
            order.TrackingNumber = request.TrackingNumber;

        if (!string.IsNullOrEmpty(request.Notes))
            order.Notes = request.Notes;

        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("Order {OrderId} status changed: {OldStatus} → {NewStatus} by admin",
            order.Id, oldStatus, newStatus);

        return Result<bool>.Success(true);
    }
}

public sealed class UpdateUserRoleHandler : IRequestHandler<UpdateUserRoleCommand, Result<bool>>
{
    private readonly IAdminUserService _adminUserService;

    public UpdateUserRoleHandler(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    public async Task<Result<bool>> Handle(UpdateUserRoleCommand request, CancellationToken ct)
    {
        return await _adminUserService.UpdateUserRoleAsync(request.UserId, request.Role, ct);
    }
}

public sealed class ToggleUserLockHandler : IRequestHandler<ToggleUserLockCommand, Result<bool>>
{
    private readonly IAdminUserService _adminUserService;

    public ToggleUserLockHandler(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    public async Task<Result<bool>> Handle(ToggleUserLockCommand request, CancellationToken ct)
    {
        return await _adminUserService.ToggleUserLockAsync(request.UserId, request.Lock, ct);
    }
}

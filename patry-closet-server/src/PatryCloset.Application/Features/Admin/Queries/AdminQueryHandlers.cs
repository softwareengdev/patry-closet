using MediatR;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Admin.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Admin.Queries;

public sealed class GetDashboardStatsHandler : IRequestHandler<GetDashboardStatsQuery, Result<DashboardStatsDto>>
{
    private readonly IRepository<Product> _products;
    private readonly IRepository<Order> _orders;
    private readonly IRepository<ProductVariant> _variants;
    private readonly IAdminUserService _adminUserService;

    public GetDashboardStatsHandler(
        IRepository<Product> products,
        IRepository<Order> orders,
        IRepository<ProductVariant> variants,
        IAdminUserService adminUserService)
    {
        _products = products;
        _orders = orders;
        _variants = variants;
        _adminUserService = adminUserService;
    }

    public async Task<Result<DashboardStatsDto>> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var allProducts = await _products.AsQueryable().AsNoTracking().ToListAsync(ct);
        var allOrders = await _orders.AsQueryable().AsNoTracking()
            .Include(o => o.Items)
            .ToListAsync(ct);
        var allVariants = await _variants.AsQueryable().AsNoTracking().ToListAsync(ct);

        var stats = new DashboardStatsDto
        {
            TotalProducts = allProducts.Count,
            ActiveProducts = allProducts.Count(p => p.IsActive),
            TotalOrders = allOrders.Count,
            PendingOrders = allOrders.Count(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Processing),
            CompletedOrders = allOrders.Count(o => o.Status == OrderStatus.Delivered),
            TotalUsers = await _adminUserService.GetTotalUserCountAsync(ct),
            TotalRevenue = allOrders
                .Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded)
                .Sum(o => o.Total),
            RevenueThisMonth = allOrders
                .Where(o => o.CreatedAt >= startOfMonth && o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded)
                .Sum(o => o.Total),
            LowStockVariants = allVariants.Count(v => v.IsActive && v.StockQuantity > 0 && v.StockQuantity <= 5),
            OutOfStockVariants = allVariants.Count(v => v.IsActive && v.StockQuantity == 0),
            RecentOrders = allOrders
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => new RecentOrderDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.ShippingFullName,
                    TotalAmount = o.Total,
                    Status = o.Status.ToString(),
                    CreatedAt = o.CreatedAt
                }).ToList(),
            TopProducts = allOrders
                .Where(o => o.Status != OrderStatus.Cancelled)
                .SelectMany(o => o.Items)
                .GroupBy(i => new { i.ProductId, i.ProductName })
                .Select(g => new TopProductDto
                {
                    Id = g.Key.ProductId,
                    Name = g.Key.ProductName,
                    TotalSold = g.Sum(i => i.Quantity),
                    Revenue = g.Sum(i => i.UnitPrice * i.Quantity)
                })
                .OrderByDescending(p => p.Revenue)
                .Take(5)
                .ToList(),
            RevenueByMonth = allOrders
                .Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded)
                .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
                .Select(g => new RevenuePeriodDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Revenue = g.Sum(o => o.Total),
                    OrderCount = g.Count()
                })
                .OrderByDescending(r => r.Period)
                .Take(12)
                .ToList()
        };

        return Result<DashboardStatsDto>.Success(stats);
    }
}

public sealed class GetAdminUsersHandler : IRequestHandler<GetAdminUsersQuery, Result<PaginatedList<AdminUserDto>>>
{
    private readonly IAdminUserService _adminUserService;
    private readonly IRepository<Order> _orders;

    public GetAdminUsersHandler(IAdminUserService adminUserService, IRepository<Order> orders)
    {
        _adminUserService = adminUserService;
        _orders = orders;
    }

    public async Task<Result<PaginatedList<AdminUserDto>>> Handle(GetAdminUsersQuery request, CancellationToken ct)
    {
        var (users, totalCount) = await _adminUserService.GetUsersPagedAsync(
            request.Page, request.PageSize, request.Search, ct);

        var userIds = users.Select(u => u.Id).ToList();

        // Get order data for these users through CustomerProfile
        var ordersWithProfile = await _orders.AsQueryable().AsNoTracking()
            .Include(o => o.CustomerProfile)
            .Where(o => userIds.Contains(o.CustomerProfile.UserId))
            .ToListAsync(ct);

        var userDtos = users.Select(u =>
        {
            var userOrders = ordersWithProfile.Where(o => o.CustomerProfile.UserId == u.Id).ToList();
            return new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Roles = u.Roles,
                IsLocked = u.IsLocked,
                CreatedAt = u.CreatedAt,
                OrderCount = userOrders.Count,
                TotalSpent = userOrders
                    .Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded)
                    .Sum(o => o.Total)
            };
        }).ToList();

        var result = PaginatedList<AdminUserDto>.Create(
            userDtos, totalCount, request.Page, request.PageSize);

        return Result<PaginatedList<AdminUserDto>>.Success(result);
    }
}

public sealed class GetAdminOrdersHandler : IRequestHandler<GetAdminOrdersQuery, Result<PaginatedList<AdminOrderDto>>>
{
    private readonly IRepository<Order> _orders;
    private readonly IAdminUserService _adminUserService;

    public GetAdminOrdersHandler(IRepository<Order> orders, IAdminUserService adminUserService)
    {
        _orders = orders;
        _adminUserService = adminUserService;
    }

    public async Task<Result<PaginatedList<AdminOrderDto>>> Handle(GetAdminOrdersQuery request, CancellationToken ct)
    {
        var query = _orders.AsQueryable().AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Include(o => o.CustomerProfile)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var status))
            query = query.Where(o => o.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(o => o.OrderNumber.ToLower().Contains(search)
                || o.ShippingFullName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        // Get customer emails in batch
        var userIds = orders
            .Select(o => o.CustomerProfile.UserId)
            .Distinct()
            .ToList();
        var emails = await _adminUserService.GetEmailsByUserIdsAsync(userIds, ct);

        var orderDtos = orders.Select(o => new AdminOrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            CustomerName = o.ShippingFullName,
            CustomerEmail = emails.GetValueOrDefault(o.CustomerProfile.UserId, ""),
            TotalAmount = o.Total,
            Status = o.Status.ToString(),
            PaymentIntentId = o.Payment?.StripePaymentIntentId,
            TrackingNumber = o.TrackingNumber,
            ItemCount = o.Items.Sum(i => i.Quantity),
            CreatedAt = o.CreatedAt,
            UpdatedAt = o.UpdatedAt
        }).ToList();

        var result = PaginatedList<AdminOrderDto>.Create(
            orderDtos, totalCount, request.Page, request.PageSize);

        return Result<PaginatedList<AdminOrderDto>>.Success(result);
    }
}

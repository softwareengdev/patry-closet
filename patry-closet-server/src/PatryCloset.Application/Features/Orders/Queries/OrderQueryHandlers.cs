using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Orders.Commands;
using PatryCloset.Application.Features.Orders.DTOs;
using PatryCloset.Domain.Common;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Events;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Orders.Queries;

// ─── Get User Orders (paginated) ───

public sealed class GetOrdersQueryHandler(
    IRepository<Order> orderRepo)
    : IRequestHandler<GetOrdersQuery, Result<PaginatedList<OrderSummaryDto>>>
{
    public async Task<Result<PaginatedList<OrderSummaryDto>>> Handle(GetOrdersQuery request, CancellationToken ct)
    {
        var f = request.Filters;
        var query = orderRepo.AsQueryable()
            .Where(o => o.CustomerProfileId == request.CustomerProfileId)
            .Include(o => o.Items)
            .AsNoTracking();

        // Filters
        if (!string.IsNullOrWhiteSpace(f.Status) && Enum.TryParse<OrderStatus>(f.Status, true, out var status))
            query = query.Where(o => o.Status == status);

        if (f.FromDate.HasValue)
            query = query.Where(o => o.CreatedAt >= f.FromDate.Value);

        if (f.ToDate.HasValue)
            query = query.Where(o => o.CreatedAt <= f.ToDate.Value);

        // Sorting
        query = f.SortBy.ToLower() switch
        {
            "total" => query.OrderByDescending(o => o.Total),
            "status" => query.OrderBy(o => o.Status),
            _ => query.OrderByDescending(o => o.CreatedAt),
        };

        var totalCount = await query.CountAsync(ct);
        var orders = await query
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync(ct);

        var dtos = orders.Select(OrderMapper.MapToSummary).ToList();
        return Result<PaginatedList<OrderSummaryDto>>.Success(
            PaginatedList<OrderSummaryDto>.Create(dtos, totalCount, f.Page, f.PageSize));
    }
}

// ─── Get Single Order Detail ───

public sealed class GetOrderByIdQueryHandler(
    IRepository<Order> orderRepo)
    : IRequestHandler<GetOrderByIdQuery, Result<OrderDto>>
{
    public async Task<Result<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken ct)
    {
        var order = await orderRepo.AsQueryable()
            .Where(o => o.Id == request.OrderId && o.CustomerProfileId == request.CustomerProfileId)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Include(o => o.StatusHistory.OrderByDescending(s => s.Timestamp))
            .AsNoTracking()
            .FirstOrDefaultAsync(ct);

        if (order is null)
            return Result<OrderDto>.Failure("Pedido no encontrado");

        return Result<OrderDto>.Success(OrderMapper.MapToDto(order));
    }
}

// ─── Admin: Get All Orders ───

public sealed class GetAllOrdersQueryHandler(
    IRepository<Order> orderRepo)
    : IRequestHandler<GetAllOrdersQuery, Result<PaginatedList<OrderSummaryDto>>>
{
    public async Task<Result<PaginatedList<OrderSummaryDto>>> Handle(GetAllOrdersQuery request, CancellationToken ct)
    {
        var f = request.Filters;
        var query = orderRepo.AsQueryable()
            .Include(o => o.Items)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(f.Status) && Enum.TryParse<OrderStatus>(f.Status, true, out var status))
            query = query.Where(o => o.Status == status);

        if (f.FromDate.HasValue)
            query = query.Where(o => o.CreatedAt >= f.FromDate.Value);

        if (f.ToDate.HasValue)
            query = query.Where(o => o.CreatedAt <= f.ToDate.Value);

        query = query.OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var orders = await query
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync(ct);

        var dtos = orders.Select(OrderMapper.MapToSummary).ToList();
        return Result<PaginatedList<OrderSummaryDto>>.Success(
            PaginatedList<OrderSummaryDto>.Create(dtos, totalCount, f.Page, f.PageSize));
    }
}

internal static class OrderMapper
{
    internal static OrderSummaryDto MapToSummary(Order o) => new()
    {
        Id = o.Id,
        OrderNumber = o.OrderNumber,
        Status = o.Status.ToString(),
        Total = o.Total,
        Currency = o.Currency,
        ItemCount = o.Items.Sum(i => i.Quantity),
        FirstItemImage = o.Items.FirstOrDefault()?.ProductImageUrl,
        CreatedAt = o.CreatedAt,
    };

    internal static OrderDto MapToDto(Order o) => new()
    {
        Id = o.Id,
        OrderNumber = o.OrderNumber,
        Status = o.Status.ToString(),
        Subtotal = o.Subtotal,
        ShippingCost = o.ShippingCost,
        Tax = o.Tax,
        DiscountAmount = o.DiscountAmount,
        Total = o.Total,
        Currency = o.Currency,
        ShippingMethod = o.ShippingMethod.ToString(),
        TrackingNumber = o.TrackingNumber,
        Notes = o.Notes,
        CouponCode = o.CouponCode,
        ShippingAddress = new OrderAddressDto
        {
            FullName = o.ShippingFullName,
            Street = o.ShippingStreet,
            Street2 = o.ShippingStreet2,
            City = o.ShippingCity,
            Province = o.ShippingProvince,
            PostalCode = o.ShippingPostalCode,
            Country = o.ShippingCountry,
            Phone = o.ShippingPhone,
        },
        Items = o.Items.Select(i => new OrderItemDto
        {
            Id = i.Id,
            ProductName = i.ProductName,
            ProductImageUrl = i.ProductImageUrl,
            Sku = i.Sku,
            Color = i.Color,
            Size = i.Size,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Total = i.Total,
            ProductId = i.ProductId,
        }).ToList().AsReadOnly(),
        StatusHistory = o.StatusHistory?.OrderByDescending(s => s.Timestamp).Select(s => new OrderStatusHistoryDto
        {
            Status = s.Status.ToString(),
            Note = s.Note,
            Timestamp = s.Timestamp,
        }).ToList().AsReadOnly(),
        Payment = o.Payment is not null ? new OrderPaymentDto
        {
            Status = o.Payment.Status.ToString(),
            Amount = o.Payment.Amount,
            Currency = o.Payment.Currency,
            PaymentMethod = o.Payment.PaymentMethod,
            PaidAt = o.Payment.PaidAt,
        } : null,
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt,
    };
}

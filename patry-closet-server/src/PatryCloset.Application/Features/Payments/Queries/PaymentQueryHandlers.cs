using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Payments.Queries;

public sealed class GetPaymentStatusQueryHandler(
    IRepository<Order> orderRepo,
    IPaymentService paymentService,
    ILogger<GetPaymentStatusQueryHandler> logger)
    : IRequestHandler<GetPaymentStatusQuery, Result<PaymentStatusDto>>
{
    public async Task<Result<PaymentStatusDto>> Handle(
        GetPaymentStatusQuery request, CancellationToken ct)
    {
        var order = await orderRepo.AsQueryable()
            .Include(o => o.Payment)
            .AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.Id == request.OrderId &&
                o.CustomerProfileId == request.CustomerProfileId, ct);

        if (order is null)
            return Result<PaymentStatusDto>.Failure("Pedido no encontrado");

        string? receiptUrl = null;
        string? failureMessage = null;

        // Get live status from Stripe if we have a PaymentIntent
        if (order.Payment is not null && !string.IsNullOrEmpty(order.Payment.StripePaymentIntentId))
        {
            try
            {
                var detail = await paymentService.GetPaymentIntentAsync(
                    order.Payment.StripePaymentIntentId, ct);
                receiptUrl = detail.ReceiptUrl;
                failureMessage = detail.FailureMessage;
            }
            catch
            {
                logger.LogWarning("Could not fetch Stripe details for {IntentId}",
                    order.Payment.StripePaymentIntentId);
            }
        }

        return Result<PaymentStatusDto>.Success(new PaymentStatusDto
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            PaymentStatus = order.Payment?.Status.ToString() ?? "Unknown",
            OrderStatus = order.Status.ToString(),
            Amount = order.Total,
            Currency = order.Currency,
            PaymentMethod = order.Payment?.PaymentMethod,
            PaidAt = order.Payment?.PaidAt,
            ReceiptUrl = receiptUrl,
            FailureMessage = failureMessage,
        });
    }
}

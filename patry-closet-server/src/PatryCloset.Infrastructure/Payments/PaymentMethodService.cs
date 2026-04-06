using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Infrastructure.Persistence;
using Stripe;

namespace PatryCloset.Infrastructure.Payments;

public sealed class PaymentMethodService : IPaymentMethodService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<PaymentMethodService> _logger;
    private readonly Stripe.PaymentMethodService _stripePaymentMethodService;
    private readonly Stripe.CustomerService _stripeCustomerService;

    public PaymentMethodService(
        ApplicationDbContext dbContext,
        IOptions<StripeSettings> settings,
        ILogger<PaymentMethodService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;

        StripeConfiguration.ApiKey = settings.Value.SecretKey;
        _stripePaymentMethodService = new Stripe.PaymentMethodService();
        _stripeCustomerService = new Stripe.CustomerService();
    }

    public async Task<Result<PaymentMethodResponse>> AddPaymentMethodAsync(
        string userId, string stripePaymentMethodId, CancellationToken ct)
    {
        try
        {
            // Get or create Stripe customer
            var stripeCustomerId = await GetOrCreateStripeCustomerAsync(userId, ct);
            if (string.IsNullOrEmpty(stripeCustomerId))
                return Result<PaymentMethodResponse>.Failure("No se pudo crear el cliente en Stripe");

            // Retrieve card details from Stripe
            var stripePaymentMethod = await _stripePaymentMethodService.GetAsync(
                stripePaymentMethodId, cancellationToken: ct);

            if (stripePaymentMethod.Card is null)
                return Result<PaymentMethodResponse>.Failure("El método de pago no es una tarjeta válida");

            // Attach to customer
            await _stripePaymentMethodService.AttachAsync(
                stripePaymentMethodId,
                new PaymentMethodAttachOptions { Customer = stripeCustomerId },
                cancellationToken: ct);

            // Check if first payment method — set as default
            var existingCount = await _dbContext.SavedPaymentMethods
                .CountAsync(pm => pm.UserId == userId, ct);

            var isDefault = existingCount == 0;

            if (isDefault)
            {
                await _stripeCustomerService.UpdateAsync(
                    stripeCustomerId,
                    new CustomerUpdateOptions
                    {
                        InvoiceSettings = new CustomerInvoiceSettingsOptions
                        {
                            DefaultPaymentMethod = stripePaymentMethodId,
                        },
                    },
                    cancellationToken: ct);
            }

            var savedMethod = new SavedPaymentMethod
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                StripePaymentMethodId = stripePaymentMethodId,
                StripeCustomerId = stripeCustomerId,
                Brand = stripePaymentMethod.Card.Brand ?? "unknown",
                Last4 = stripePaymentMethod.Card.Last4 ?? "****",
                ExpMonth = (int)stripePaymentMethod.Card.ExpMonth,
                ExpYear = (int)stripePaymentMethod.Card.ExpYear,
                IsDefault = isDefault,
                CardholderName = stripePaymentMethod.BillingDetails?.Name,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
            };

            _dbContext.SavedPaymentMethods.Add(savedMethod);
            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Payment method {Brand} ****{Last4} added for user {UserId}",
                savedMethod.Brand, savedMethod.Last4, userId);

            return Result<PaymentMethodResponse>.Success(MapToResponse(savedMethod));
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error adding payment method for user {UserId}: {Code}",
                userId, ex.StripeError?.Code);
            return Result<PaymentMethodResponse>.Failure(
                $"Error al agregar método de pago: {ex.StripeError?.Message ?? ex.Message}");
        }
    }

    public async Task<Result> RemovePaymentMethodAsync(
        string userId, Guid paymentMethodId, CancellationToken ct)
    {
        var savedMethod = await _dbContext.SavedPaymentMethods
            .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId && pm.UserId == userId, ct);

        if (savedMethod is null)
            return Result.Failure("Método de pago no encontrado");

        try
        {
            // Detach from Stripe customer
            await _stripePaymentMethodService.DetachAsync(
                savedMethod.StripePaymentMethodId, cancellationToken: ct);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex,
                "Stripe error detaching payment method {StripeId}: {Code}",
                savedMethod.StripePaymentMethodId, ex.StripeError?.Code);
        }

        var wasDefault = savedMethod.IsDefault;
        _dbContext.SavedPaymentMethods.Remove(savedMethod);
        await _dbContext.SaveChangesAsync(ct);

        // If removed method was default, set another as default
        if (wasDefault)
        {
            var nextDefault = await _dbContext.SavedPaymentMethods
                .Where(pm => pm.UserId == userId)
                .OrderByDescending(pm => pm.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (nextDefault is not null)
            {
                nextDefault.IsDefault = true;
                nextDefault.UpdatedAt = DateTime.UtcNow;
                nextDefault.UpdatedBy = userId;
                await _dbContext.SaveChangesAsync(ct);

                try
                {
                    await _stripeCustomerService.UpdateAsync(
                        nextDefault.StripeCustomerId,
                        new CustomerUpdateOptions
                        {
                            InvoiceSettings = new CustomerInvoiceSettingsOptions
                            {
                                DefaultPaymentMethod = nextDefault.StripePaymentMethodId,
                            },
                        },
                        cancellationToken: ct);
                }
                catch (StripeException ex)
                {
                    _logger.LogWarning(ex, "Could not update default payment method on Stripe");
                }
            }
        }

        _logger.LogInformation("Payment method {Id} removed for user {UserId}", paymentMethodId, userId);
        return Result.Success();
    }

    public async Task<Result> SetDefaultPaymentMethodAsync(
        string userId, Guid paymentMethodId, CancellationToken ct)
    {
        var savedMethod = await _dbContext.SavedPaymentMethods
            .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId && pm.UserId == userId, ct);

        if (savedMethod is null)
            return Result.Failure("Método de pago no encontrado");

        // Unset all defaults for user
        var allMethods = await _dbContext.SavedPaymentMethods
            .Where(pm => pm.UserId == userId)
            .ToListAsync(ct);

        foreach (var method in allMethods)
        {
            method.IsDefault = method.Id == paymentMethodId;
            method.UpdatedAt = DateTime.UtcNow;
            method.UpdatedBy = userId;
        }

        await _dbContext.SaveChangesAsync(ct);

        // Update on Stripe
        try
        {
            await _stripeCustomerService.UpdateAsync(
                savedMethod.StripeCustomerId,
                new CustomerUpdateOptions
                {
                    InvoiceSettings = new CustomerInvoiceSettingsOptions
                    {
                        DefaultPaymentMethod = savedMethod.StripePaymentMethodId,
                    },
                },
                cancellationToken: ct);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Could not update default payment method on Stripe for user {UserId}", userId);
        }

        _logger.LogInformation("Default payment method set to {Id} for user {UserId}", paymentMethodId, userId);
        return Result.Success();
    }

    public async Task<Result<IReadOnlyList<PaymentMethodResponse>>> GetPaymentMethodsAsync(
        string userId, CancellationToken ct)
    {
        var methods = await _dbContext.SavedPaymentMethods
            .AsNoTracking()
            .Where(pm => pm.UserId == userId)
            .OrderByDescending(pm => pm.IsDefault)
            .ThenByDescending(pm => pm.CreatedAt)
            .Select(pm => new PaymentMethodResponse
            {
                Id = pm.Id,
                Brand = pm.Brand,
                Last4 = pm.Last4,
                ExpMonth = pm.ExpMonth,
                ExpYear = pm.ExpYear,
                IsDefault = pm.IsDefault,
                CardholderName = pm.CardholderName,
            })
            .ToListAsync(ct);

        return Result<IReadOnlyList<PaymentMethodResponse>>.Success(methods.AsReadOnly());
    }

    private async Task<string?> GetOrCreateStripeCustomerAsync(string userId, CancellationToken ct)
    {
        // Check if user already has a Stripe customer ID on their profile
        var profile = await _dbContext.CustomerProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (profile is not null && !string.IsNullOrEmpty(profile.StripeCustomerId))
            return profile.StripeCustomerId;

        // Check if any saved payment method already has a customer ID
        var existingMethod = await _dbContext.SavedPaymentMethods
            .AsNoTracking()
            .FirstOrDefaultAsync(pm => pm.UserId == userId, ct);

        if (existingMethod is not null)
            return existingMethod.StripeCustomerId;

        // Create new Stripe customer
        try
        {
            var customerOptions = new CustomerCreateOptions
            {
                Metadata = new Dictionary<string, string> { ["userId"] = userId },
            };

            if (profile is not null)
            {
                customerOptions.Name = $"{profile.FirstName} {profile.LastName}".Trim();
            }

            var customer = await _stripeCustomerService.CreateAsync(
                customerOptions, cancellationToken: ct);

            // Store on profile
            if (profile is not null)
            {
                profile.StripeCustomerId = customer.Id;
                profile.UpdatedAt = DateTime.UtcNow;
                profile.UpdatedBy = userId;
                await _dbContext.SaveChangesAsync(ct);
            }

            _logger.LogInformation("Stripe customer {CustomerId} created for user {UserId}",
                customer.Id, userId);

            return customer.Id;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to create Stripe customer for user {UserId}", userId);
            return null;
        }
    }

    private static PaymentMethodResponse MapToResponse(SavedPaymentMethod pm) => new()
    {
        Id = pm.Id,
        Brand = pm.Brand,
        Last4 = pm.Last4,
        ExpMonth = pm.ExpMonth,
        ExpYear = pm.ExpYear,
        IsDefault = pm.IsDefault,
        CardholderName = pm.CardholderName,
    };
}

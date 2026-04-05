using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PatryCloset.Application.Common.Interfaces;
using Stripe;

namespace PatryCloset.Infrastructure.Payments;

/// <summary>
/// Production-grade Stripe payment service using PaymentIntents API (SCA/3D Secure ready).
/// Handles intent creation, confirmation, cancellation, refunds, and customer management.
/// </summary>
public sealed class StripePaymentService : IPaymentService
{
    private readonly StripeSettings _settings;
    private readonly ILogger<StripePaymentService> _logger;
    private readonly PaymentIntentService _paymentIntentService;
    private readonly RefundService _refundService;
    private readonly CustomerService _customerService;

    public StripePaymentService(
        IOptions<StripeSettings> settings,
        ILogger<StripePaymentService> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        StripeConfiguration.ApiKey = _settings.SecretKey;
        StripeConfiguration.MaxNetworkRetries = 2;

        _paymentIntentService = new PaymentIntentService();
        _refundService = new RefundService();
        _customerService = new CustomerService();
    }

    public async Task<PaymentIntentResult> CreatePaymentIntentAsync(
        decimal amount,
        string currency,
        string? customerEmail,
        Dictionary<string, string>? metadata = null,
        CancellationToken ct = default)
    {
        var amountCents = (long)Math.Round(amount * 100);

        if (amountCents < _settings.MinimumAmountCents)
        {
            _logger.LogWarning("PaymentIntent amount {Amount}c below minimum {Min}c",
                amountCents, _settings.MinimumAmountCents);
            return new PaymentIntentResult
            {
                Status = "invalid_amount",
                PaymentIntentId = string.Empty,
                ClientSecret = string.Empty,
            };
        }

        var stripeCustomerId = await GetOrCreateStripeCustomerAsync(customerEmail, ct);

        var options = new PaymentIntentCreateOptions
        {
            Amount = amountCents,
            Currency = currency.ToLowerInvariant(),
            Customer = stripeCustomerId,
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
            Metadata = metadata ?? [],
            StatementDescriptor = _settings.StatementDescriptor.Length > 22
                ? _settings.StatementDescriptor[..22]
                : _settings.StatementDescriptor,
            Description = "PATRY♡CLOSET order",
        };

        if (!string.IsNullOrEmpty(customerEmail))
            options.ReceiptEmail = customerEmail;

        try
        {
            var intent = await _paymentIntentService.CreateAsync(options, cancellationToken: ct);

            _logger.LogInformation(
                "PaymentIntent created: {IntentId} for {Amount} {Currency}",
                intent.Id, amount, currency);

            return new PaymentIntentResult
            {
                PaymentIntentId = intent.Id,
                ClientSecret = intent.ClientSecret,
                Status = intent.Status,
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating PaymentIntent: {Code} {Message}",
                ex.StripeError?.Code, ex.StripeError?.Message);

            return new PaymentIntentResult
            {
                Status = "error",
                PaymentIntentId = string.Empty,
                ClientSecret = string.Empty,
            };
        }
    }

    public async Task<PaymentIntentResult> ConfirmPaymentIntentAsync(
        string paymentIntentId,
        CancellationToken ct = default)
    {
        try
        {
            var intent = await _paymentIntentService.GetAsync(paymentIntentId, cancellationToken: ct);

            return new PaymentIntentResult
            {
                PaymentIntentId = intent.Id,
                ClientSecret = intent.ClientSecret,
                Status = intent.Status,
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error confirming PaymentIntent {Id}: {Code}",
                paymentIntentId, ex.StripeError?.Code);

            return new PaymentIntentResult
            {
                PaymentIntentId = paymentIntentId,
                Status = "error",
                ClientSecret = string.Empty,
            };
        }
    }

    public async Task<RefundResult> CreateRefundAsync(
        string paymentIntentId,
        decimal? amount = null,
        CancellationToken ct = default)
    {
        try
        {
            var options = new RefundCreateOptions
            {
                PaymentIntent = paymentIntentId,
                Reason = "requested_by_customer",
            };

            if (amount.HasValue)
                options.Amount = (long)Math.Round(amount.Value * 100);

            var refund = await _refundService.CreateAsync(options, cancellationToken: ct);

            _logger.LogInformation(
                "Refund created: {RefundId} for PaymentIntent {IntentId}, amount: {Amount}",
                refund.Id, paymentIntentId, refund.Amount / 100m);

            return new RefundResult
            {
                RefundId = refund.Id,
                Status = refund.Status,
                Amount = refund.Amount / 100m,
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating refund for {IntentId}: {Code}",
                paymentIntentId, ex.StripeError?.Code);

            return new RefundResult
            {
                RefundId = string.Empty,
                Status = "error",
                Amount = 0,
            };
        }
    }

    public async Task<PaymentIntentResult> CancelPaymentIntentAsync(
        string paymentIntentId,
        CancellationToken ct = default)
    {
        try
        {
            var intent = await _paymentIntentService.CancelAsync(
                paymentIntentId,
                cancellationToken: ct);

            _logger.LogInformation("PaymentIntent cancelled: {IntentId}", intent.Id);

            return new PaymentIntentResult
            {
                PaymentIntentId = intent.Id,
                ClientSecret = intent.ClientSecret,
                Status = intent.Status,
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error cancelling PaymentIntent {Id}", paymentIntentId);

            return new PaymentIntentResult
            {
                PaymentIntentId = paymentIntentId,
                Status = "error",
                ClientSecret = string.Empty,
            };
        }
    }

    public async Task<PaymentIntentDetailResult> GetPaymentIntentAsync(
        string paymentIntentId,
        CancellationToken ct = default)
    {
        try
        {
            var intent = await _paymentIntentService.GetAsync(
                paymentIntentId,
                new PaymentIntentGetOptions { Expand = ["latest_charge"] },
                cancellationToken: ct);

            var charge = intent.LatestCharge;

            return new PaymentIntentDetailResult
            {
                PaymentIntentId = intent.Id,
                Status = intent.Status,
                Amount = intent.Amount / 100m,
                Currency = intent.Currency,
                PaymentMethodType = charge?.PaymentMethodDetails?.Type ?? "unknown",
                ChargeId = charge?.Id,
                ReceiptUrl = charge?.ReceiptUrl,
                FailureMessage = intent.LastPaymentError?.Message,
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error getting PaymentIntent {Id}", paymentIntentId);
            throw;
        }
    }

    private async Task<string?> GetOrCreateStripeCustomerAsync(string? email, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(email)) return null;

        try
        {
            var searchResult = await _customerService.SearchAsync(
                new CustomerSearchOptions { Query = $"email:'{email}'" },
                cancellationToken: ct);

            if (searchResult.Data.Count > 0)
                return searchResult.Data[0].Id;

            var customer = await _customerService.CreateAsync(
                new CustomerCreateOptions { Email = email },
                cancellationToken: ct);

            _logger.LogInformation("Stripe customer created: {CustomerId} for {Email}",
                customer.Id, email);

            return customer.Id;
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Could not create/find Stripe customer for {Email}", email);
            return null;
        }
    }
}

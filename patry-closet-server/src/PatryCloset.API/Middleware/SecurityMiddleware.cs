using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace PatryCloset.API.Middleware;

/// <summary>
/// Security headers middleware — adds OWASP-recommended HTTP security headers.
/// Applied before any response is sent to the client.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        var path = context.Request.Path.Value ?? "";

        // Prevent MIME-type sniffing (forces browser to respect Content-Type)
        headers["X-Content-Type-Options"] = "nosniff";

        // Prevent clickjacking — only allow same-origin framing
        headers["X-Frame-Options"] = "DENY";

        // Legacy XSS filter — modern browsers use CSP instead, but still useful for IE
        headers["X-XSS-Protection"] = "1; mode=block";

        // Control referrer information leakage
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Restrict browser features/APIs
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(self)";

        // Prevent search engines from caching sensitive API responses
        headers["X-Robots-Tag"] = "noindex, nofollow";

        // Remove server identity disclosure
        headers.Remove("Server");
        headers.Remove("X-Powered-By");

        // Content Security Policy — relaxed for Swagger UI, strict for API
        if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase))
        {
            headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' data:; " +
                "connect-src 'self'; " +
                "frame-ancestors 'none'";
        }
        else
        {
            headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
        }

        return next(context);
    }
}

/// <summary>
/// Correlation ID middleware — assigns a unique trace ID to every request
/// for end-to-end observability across logs, responses, and downstream services.
/// </summary>
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        // Accept client correlation ID or generate a new one
        if (!context.Request.Headers.TryGetValue(HeaderName, out var correlationId)
            || string.IsNullOrWhiteSpace(correlationId))
        {
            correlationId = Guid.NewGuid().ToString("N");
        }

        context.Items["CorrelationId"] = correlationId.ToString();
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = correlationId.ToString();
            return Task.CompletedTask;
        });

        // Push into Serilog context for structured logging
        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId.ToString()))
        using (Serilog.Context.LogContext.PushProperty("ClientIP", context.Connection.RemoteIpAddress?.ToString() ?? "unknown"))
        using (Serilog.Context.LogContext.PushProperty("UserId", context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous"))
        {
            await next(context);
        }
    }
}

/// <summary>
/// Request timing middleware — tracks request duration and adds Server-Timing header.
/// Useful for performance monitoring and debugging slow endpoints.
/// </summary>
public sealed class RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        context.Response.OnStarting(() =>
        {
            sw.Stop();
            context.Response.Headers["Server-Timing"] = $"total;dur={sw.ElapsedMilliseconds}";
            return Task.CompletedTask;
        });

        await next(context);

        sw.Stop();
        var elapsed = sw.ElapsedMilliseconds;

        // Log slow requests (>500ms) as warnings
        if (elapsed > 500)
        {
            logger.LogWarning(
                "Slow request: {Method} {Path} took {ElapsedMs}ms (Status: {StatusCode})",
                context.Request.Method,
                context.Request.Path,
                elapsed,
                context.Response.StatusCode);
        }
    }
}

/// <summary>
/// Rate limiting configuration — defines throttling policies per endpoint group.
/// Uses .NET 7+ built-in rate limiter for zero-dependency rate limiting.
/// </summary>
public static class RateLimitingConfiguration
{
    public static IServiceCollection AddRateLimitingPolicies(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.OnRejected = async (context, ct) =>
            {
                context.HttpContext.Response.ContentType = "application/json";
                var response = new
                {
                    success = false,
                    message = "Too many requests. Please try again later.",
                    retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                        ? retryAfter.TotalSeconds
                        : (double?)null,
                };

                if (retryAfter != default)
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString();
                }

                await context.HttpContext.Response.WriteAsJsonAsync(response, ct);
            };

            // Auth endpoints — strict (prevent brute force)
            options.AddFixedWindowLimiter("auth", limiter =>
            {
                limiter.PermitLimit = 10;           // 10 requests
                limiter.Window = TimeSpan.FromMinutes(1);  // per minute
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiter.QueueLimit = 2;
            });

            // Catalog endpoints — relaxed (high traffic expected)
            options.AddSlidingWindowLimiter("catalog", limiter =>
            {
                limiter.PermitLimit = 120;          // 120 requests
                limiter.Window = TimeSpan.FromMinutes(1);  // per minute
                limiter.SegmentsPerWindow = 4;             // 4 segments of 15s
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiter.QueueLimit = 10;
            });

            // Write operations — moderate (cart, orders, payments)
            options.AddTokenBucketLimiter("write", limiter =>
            {
                limiter.TokenLimit = 30;            // burst up to 30
                limiter.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
                limiter.TokensPerPeriod = 5;        // 5 tokens every 10s = 30/min sustained
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiter.QueueLimit = 5;
                limiter.AutoReplenishment = true;
            });

            // Admin endpoints — moderate
            options.AddFixedWindowLimiter("admin", limiter =>
            {
                limiter.PermitLimit = 60;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiter.QueueLimit = 5;
            });

            // Webhook endpoints — higher limit (Stripe may send bursts)
            options.AddFixedWindowLimiter("webhook", limiter =>
            {
                limiter.PermitLimit = 100;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiter.QueueLimit = 20;
            });

            // Global fallback — applied to untagged endpoints
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 200,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 10,
                    }));
        });

        return services;
    }
}

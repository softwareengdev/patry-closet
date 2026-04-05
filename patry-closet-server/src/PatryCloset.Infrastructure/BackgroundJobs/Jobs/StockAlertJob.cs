using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Infrastructure.Persistence;

namespace PatryCloset.Infrastructure.BackgroundJobs.Jobs;

public sealed class StockAlertJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<StockAlertJob> _logger;

    public StockAlertJob(ApplicationDbContext db, ILogger<StockAlertJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task CheckLowStockAsync()
    {
        const int lowStockThreshold = 5;
        var lowStock = await _db.ProductVariants
            .Include(v => v.Product)
            .Where(v => v.IsActive && v.StockQuantity <= lowStockThreshold && v.StockQuantity > 0)
            .ToListAsync();

        foreach (var variant in lowStock)
        {
            _logger.LogWarning(
                "LOW STOCK ALERT: {Product} ({Color}/{Size}) — only {Qty} remaining",
                variant.Product?.Name ?? "Unknown", variant.Color, variant.Size, variant.StockQuantity);
        }

        var outOfStock = await _db.ProductVariants
            .Include(v => v.Product)
            .Where(v => v.IsActive && v.StockQuantity == 0)
            .CountAsync();

        if (outOfStock > 0)
            _logger.LogError("OUT OF STOCK: {Count} variants have zero stock", outOfStock);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Domain.Enums;
using PatryCloset.Infrastructure.Persistence;

namespace PatryCloset.Infrastructure.BackgroundJobs.Jobs;

public sealed class OrderCleanupJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<OrderCleanupJob> _logger;

    public OrderCleanupJob(ApplicationDbContext db, ILogger<OrderCleanupJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task CleanupAbandonedOrdersAsync()
    {
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var abandoned = await _db.Orders
            .Where(o => o.Status == OrderStatus.Pending && o.CreatedAt < cutoff)
            .ToListAsync();

        foreach (var order in abandoned)
        {
            order.Status = OrderStatus.Cancelled;
            _logger.LogInformation("Cancelled abandoned order {OrderId}", order.Id);
        }

        if (abandoned.Count > 0)
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Cleaned up {Count} abandoned orders", abandoned.Count);
        }
    }
}

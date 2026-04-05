using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Infrastructure.Persistence;

namespace PatryCloset.Infrastructure.BackgroundJobs.Jobs;

public sealed class StaleCartCleanupJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<StaleCartCleanupJob> _logger;

    public StaleCartCleanupJob(ApplicationDbContext db, ILogger<StaleCartCleanupJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task CleanupStaleCartsAsync()
    {
        var cutoff = DateTime.UtcNow.AddDays(-30);
        var staleCarts = await _db.Carts
            .Include(c => c.Items)
            .Where(c => c.UpdatedAt < cutoff)
            .ToListAsync();

        if (staleCarts.Count > 0)
        {
            _db.Carts.RemoveRange(staleCarts);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Removed {Count} stale carts older than 30 days", staleCarts.Count);
        }
    }
}

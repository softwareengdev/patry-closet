using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;

namespace PatryCloset.Infrastructure.BackgroundJobs.Jobs;

public sealed class CacheWarmupJob
{
    private readonly ICacheService _cache;
    private readonly ILogger<CacheWarmupJob> _logger;

    public CacheWarmupJob(ICacheService cache, ILogger<CacheWarmupJob> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task WarmupCacheAsync()
    {
        // Invalidate stale keys by removing known cache prefixes
        await _cache.RemoveAsync("categories:all");
        await _cache.RemoveAsync("products:featured:8");
        _logger.LogInformation("Cache warmup completed — stale keys cleared");
    }
}

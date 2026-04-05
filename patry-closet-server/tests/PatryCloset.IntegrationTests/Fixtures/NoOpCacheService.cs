using PatryCloset.Application.Common.Interfaces;

namespace PatryCloset.IntegrationTests.Fixtures;

/// <summary>
/// No-op cache service for integration tests to avoid JSON deserialization
/// issues with constructor-only types like PaginatedList.
/// </summary>
public class NoOpCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default) =>
        Task.FromResult<T?>(default);

    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken ct = default) =>
        Task.CompletedTask;

    public Task RemoveAsync(string key, CancellationToken ct = default) =>
        Task.CompletedTask;

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default) =>
        Task.CompletedTask;
}

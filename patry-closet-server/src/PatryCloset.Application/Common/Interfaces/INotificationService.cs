namespace PatryCloset.Application.Common.Interfaces;

public interface INotificationService
{
    Task CreateNotificationAsync(
        string userId, string type, string title, string message,
        string? data = null, string? actionUrl = null,
        CancellationToken ct = default);
}

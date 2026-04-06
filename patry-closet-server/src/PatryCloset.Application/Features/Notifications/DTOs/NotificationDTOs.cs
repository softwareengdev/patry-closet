namespace PatryCloset.Application.Features.Notifications.DTOs;

public sealed record NotificationResponse
{
    public required Guid Id { get; init; }
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required string Message { get; init; }
    public required bool Read { get; init; }
    public required DateTime CreatedAt { get; init; }
    public string? Data { get; init; }
    public string? ActionUrl { get; init; }
}

public sealed record NotificationListResponse
{
    public required List<NotificationResponse> Items { get; init; }
    public required int Total { get; init; }
    public required int Unread { get; init; }
}

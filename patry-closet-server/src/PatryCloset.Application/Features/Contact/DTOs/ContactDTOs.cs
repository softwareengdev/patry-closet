namespace PatryCloset.Application.Features.Contact.DTOs;

public sealed record SubmitContactRequest
{
    public required string Name { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public required string Subject { get; init; }
    public required string Message { get; init; }
    public string? RecaptchaToken { get; init; }
}

public sealed record ContactResponse
{
    public required bool Success { get; init; }
    public required string TicketId { get; init; }
}

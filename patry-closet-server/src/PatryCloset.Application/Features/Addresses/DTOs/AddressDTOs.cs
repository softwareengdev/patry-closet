namespace PatryCloset.Application.Features.Addresses.DTOs;

public sealed record AddressDto
{
    public required Guid Id { get; init; }
    public required string Label { get; init; }
    public required string FullName { get; init; }
    public required string Street { get; init; }
    public string? Street2 { get; init; }
    public required string City { get; init; }
    public required string Province { get; init; }
    public required string PostalCode { get; init; }
    public required string Country { get; init; }
    public string? Phone { get; init; }
    public bool IsDefault { get; init; }
}

public sealed record UpsertAddressRequest
{
    public string Label { get; init; } = "Casa";
    public required string FullName { get; init; }
    public required string Street { get; init; }
    public string? Street2 { get; init; }
    public required string City { get; init; }
    public required string Province { get; init; }
    public required string PostalCode { get; init; }
    public string Country { get; init; } = "ES";
    public string? Phone { get; init; }
    public bool IsDefault { get; init; }
}

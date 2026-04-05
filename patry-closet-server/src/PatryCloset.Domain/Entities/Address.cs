using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class Address : AuditableEntity
{
    public string Label { get; set; } = "Home";
    public string FullName { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string? Street2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "ES";
    public string? Phone { get; set; }
    public bool IsDefault { get; set; }

    public Guid CustomerProfileId { get; set; }
    public CustomerProfile CustomerProfile { get; set; } = null!;
}

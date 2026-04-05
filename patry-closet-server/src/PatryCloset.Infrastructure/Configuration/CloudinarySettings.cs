namespace PatryCloset.Infrastructure.Configuration;

/// <summary>
/// Strongly-typed Cloudinary configuration bound from appsettings.json "Cloudinary" section.
/// </summary>
public sealed class CloudinarySettings
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string DefaultFolder { get; set; } = "patrycloset";
}

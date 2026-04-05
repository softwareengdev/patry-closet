using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Infrastructure.Services;

public class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}

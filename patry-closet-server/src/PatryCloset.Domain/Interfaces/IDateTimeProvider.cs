namespace PatryCloset.Domain.Interfaces;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}

namespace PatryCloset.Application.Common.Interfaces;

public interface IBackgroundJobService
{
    string Enqueue<T>(System.Linq.Expressions.Expression<Func<T, Task>> methodCall);
    string Schedule<T>(System.Linq.Expressions.Expression<Func<T, Task>> methodCall, TimeSpan delay);
    void AddOrUpdateRecurring<T>(string recurringJobId, System.Linq.Expressions.Expression<Func<T, Task>> methodCall, string cronExpression);
    void RemoveRecurring(string recurringJobId);
}

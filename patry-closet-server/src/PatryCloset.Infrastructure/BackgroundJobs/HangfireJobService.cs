using Hangfire;
using PatryCloset.Application.Common.Interfaces;
using System.Linq.Expressions;

namespace PatryCloset.Infrastructure.BackgroundJobs;

public sealed class HangfireJobService : IBackgroundJobService
{
    private readonly IBackgroundJobClient _jobClient;
    private readonly IRecurringJobManager _recurringJobManager;

    public HangfireJobService(IBackgroundJobClient jobClient, IRecurringJobManager recurringJobManager)
    {
        _jobClient = jobClient;
        _recurringJobManager = recurringJobManager;
    }

    public string Enqueue<T>(Expression<Func<T, Task>> methodCall)
        => _jobClient.Enqueue(methodCall);

    public string Schedule<T>(Expression<Func<T, Task>> methodCall, TimeSpan delay)
        => _jobClient.Schedule(methodCall, delay);

    public void AddOrUpdateRecurring<T>(string recurringJobId, Expression<Func<T, Task>> methodCall, string cronExpression)
        => _recurringJobManager.AddOrUpdate(recurringJobId, methodCall, cronExpression);

    public void RemoveRecurring(string recurringJobId)
        => _recurringJobManager.RemoveIfExists(recurringJobId);
}

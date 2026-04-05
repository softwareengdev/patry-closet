using System.Collections;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore.Query;

namespace PatryCloset.UnitTests.Application.Helpers;

/// <summary>
/// Creates an IQueryable from a List that supports EF Core async extension methods
/// (FirstOrDefaultAsync, CountAsync, etc.). Include/ThenInclude/AsNoTracking are no-ops.
/// </summary>
internal static class AsyncQueryableExtensions
{
    internal static IQueryable<T> BuildMockQueryable<T>(this List<T> source)
        => new TestAsyncEnumerable<T>(source);
}

internal sealed class TestAsyncEnumerable<T> : IQueryable<T>, IAsyncEnumerable<T>, IOrderedQueryable<T>
{
    private readonly IQueryable<T> _inner;

    internal TestAsyncEnumerable(IEnumerable<T> enumerable)
    {
        _inner = enumerable.AsQueryable();
    }

    public Type ElementType => _inner.ElementType;
    public Expression Expression => _inner.Expression;
    public IQueryProvider Provider => new TestAsyncQueryProvider<T>(_inner.Provider);

    public IEnumerator<T> GetEnumerator() => _inner.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        => new TestAsyncEnumerator<T>(_inner.GetEnumerator());
}

internal sealed class TestAsyncQueryProvider<T> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    internal TestAsyncQueryProvider(IQueryProvider inner) => _inner = inner;

    public IQueryable CreateQuery(Expression expression)
        => _inner.CreateQuery(expression);

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        => new TestAsyncEnumerable<TElement>(_inner.CreateQuery<TElement>(expression));

    public object? Execute(Expression expression) => _inner.Execute(expression);

    public TResult Execute<TResult>(Expression expression) => _inner.Execute<TResult>(expression);

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult).GetGenericArguments()[0];
        var executeMethod = typeof(IQueryProvider)
            .GetMethod(nameof(IQueryProvider.Execute), 1, [typeof(Expression)])!
            .MakeGenericMethod(resultType);
        var result = executeMethod.Invoke(_inner, [expression]);
        return (TResult)typeof(Task)
            .GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(resultType)
            .Invoke(null, [result])!;
    }
}

internal sealed class TestAsyncEnumerator<T>(IEnumerator<T> inner) : IAsyncEnumerator<T>
{
    public T Current => inner.Current;
    public ValueTask<bool> MoveNextAsync() => new(inner.MoveNext());
    public ValueTask DisposeAsync()
    {
        inner.Dispose();
        return default;
    }
}

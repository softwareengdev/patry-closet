using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace PatryCloset.Application.Common.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        logger.LogInformation("[START] {RequestName}", requestName);

        try
        {
            var response = await next();
            logger.LogInformation("[END] {RequestName}", requestName);
            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[ERROR] {RequestName}", requestName);
            throw;
        }
    }
}

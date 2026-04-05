using System.Net;
using System.Text.Json;
using FluentValidation;
using PatryCloset.Domain.Exceptions;

namespace PatryCloset.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                validationEx.Errors.Select(e => e.ErrorMessage).ToList() as IReadOnlyList<string>),

            NotFoundException notFoundEx => (
                HttpStatusCode.NotFound,
                notFoundEx.Message,
                (IReadOnlyList<string>)[]),

            InsufficientStockException stockEx => (
                HttpStatusCode.Conflict,
                stockEx.Message,
                (IReadOnlyList<string>)[]),

            InvalidOrderStateException stateEx => (
                HttpStatusCode.UnprocessableEntity,
                stateEx.Message,
                (IReadOnlyList<string>)[]),

            DomainException domainEx => (
                HttpStatusCode.BadRequest,
                domainEx.Message,
                (IReadOnlyList<string>)[]),

            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "Unauthorized",
                (IReadOnlyList<string>)[]),

            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred",
                (IReadOnlyList<string>)[])
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
        }
        else
        {
            logger.LogWarning("Handled exception [{StatusCode}]: {Message}", (int)statusCode, message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            success = false,
            message,
            errors = errors.Count > 0 ? errors : null,
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
    }
}

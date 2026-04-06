using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Contact.DTOs;

namespace PatryCloset.Application.Features.Contact.Commands;

public sealed record SubmitContactCommand(
    string Name,
    string Email,
    string? Phone,
    string Subject,
    string Message,
    string? RecaptchaToken,
    string? IpAddress,
    string? UserAgent,
    string? UserId,
    List<string>? AttachmentUrls
) : IRequest<Result<ContactResponse>>;

public sealed class SubmitContactCommandValidator : AbstractValidator<SubmitContactCommand>
{
    private static readonly string[] ValidSubjects =
        ["product", "sizing", "influencer", "press", "sustainability", "returns", "other"];

    public SubmitContactCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Phone).MaximumLength(30).When(x => x.Phone != null);
        RuleFor(x => x.Subject)
            .NotEmpty()
            .Must(s => ValidSubjects.Contains(s))
            .WithMessage("Asunto no válido");
        RuleFor(x => x.Message).NotEmpty().MaximumLength(5000);
    }
}

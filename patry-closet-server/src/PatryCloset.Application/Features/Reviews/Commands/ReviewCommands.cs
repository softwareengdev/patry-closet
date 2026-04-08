using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Reviews.DTOs;

namespace PatryCloset.Application.Features.Reviews.Commands;

// ─── Commands ───

public sealed record CreateReviewCommand(
    Guid ProductId,
    int Rating,
    string? Title,
    string? Comment,
    string UserId
) : IRequest<Result<ReviewDto>>;

public sealed record UpdateReviewCommand(
    Guid ReviewId,
    int Rating,
    string? Title,
    string? Comment,
    string UserId
) : IRequest<Result<ReviewDto>>;

public sealed record DeleteReviewCommand(
    Guid ReviewId,
    string UserId
) : IRequest<Result<bool>>;

public sealed record ModerateReviewCommand(
    Guid ReviewId,
    bool IsApproved
) : IRequest<Result<bool>>;

// ─── Validators ───

public sealed class CreateReviewCommandValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("El producto es obligatorio");
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("La valoración debe estar entre 1 y 5");
        RuleFor(x => x.Title).MaximumLength(200).When(x => x.Title is not null);
        RuleFor(x => x.Comment).MaximumLength(2000).When(x => x.Comment is not null);
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public sealed class UpdateReviewCommandValidator : AbstractValidator<UpdateReviewCommand>
{
    public UpdateReviewCommandValidator()
    {
        RuleFor(x => x.ReviewId).NotEmpty();
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("La valoración debe estar entre 1 y 5");
        RuleFor(x => x.Title).MaximumLength(200).When(x => x.Title is not null);
        RuleFor(x => x.Comment).MaximumLength(2000).When(x => x.Comment is not null);
        RuleFor(x => x.UserId).NotEmpty();
    }
}

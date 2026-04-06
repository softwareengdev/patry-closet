using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Blog.DTOs;

namespace PatryCloset.Application.Features.Blog.Commands;

// ─── Create Blog Post ───

public sealed record CreateBlogPostCommand(CreateBlogPostRequest Post, string UserId)
    : IRequest<Result<BlogPostResponse>>;

public sealed class CreateBlogPostCommandValidator : AbstractValidator<CreateBlogPostCommand>
{
    private static readonly string[] ValidCategories =
        ["trends", "sustainability", "style-guides", "behind-the-brand", "collaborations"];

    private static readonly string[] ValidSeasons =
        ["spring-summer", "fall-winter", "resort", "all-year"];

    public CreateBlogPostCommandValidator()
    {
        RuleFor(x => x.Post.Title)
            .NotEmpty().WithMessage("El título es obligatorio")
            .MaximumLength(500);

        RuleFor(x => x.Post.Excerpt)
            .NotEmpty().WithMessage("El extracto es obligatorio")
            .MaximumLength(2000);

        RuleFor(x => x.Post.Content)
            .NotEmpty().WithMessage("El contenido es obligatorio");

        RuleFor(x => x.Post.Category)
            .NotEmpty().WithMessage("La categoría es obligatoria")
            .Must(c => ValidCategories.Contains(c))
            .WithMessage($"La categoría debe ser una de: {string.Join(", ", ValidCategories)}");

        RuleFor(x => x.Post.Season)
            .Must(s => s == null || ValidSeasons.Contains(s))
            .WithMessage($"La temporada debe ser una de: {string.Join(", ", ValidSeasons)}");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("El ID de usuario es obligatorio");
    }
}

// ─── Update Blog Post ───

public sealed record UpdateBlogPostCommand(Guid Id, UpdateBlogPostRequest Post, string UserId)
    : IRequest<Result<BlogPostResponse>>;

public sealed class UpdateBlogPostCommandValidator : AbstractValidator<UpdateBlogPostCommand>
{
    public UpdateBlogPostCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("El ID del post es obligatorio");

        RuleFor(x => x.Post.Title)
            .MaximumLength(500)
            .When(x => x.Post.Title is not null);

        RuleFor(x => x.Post.Excerpt)
            .MaximumLength(2000)
            .When(x => x.Post.Excerpt is not null);
    }
}

// ─── Delete Blog Post ───

public sealed record DeleteBlogPostCommand(Guid Id) : IRequest<Result>;

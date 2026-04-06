using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Blog.DTOs;

namespace PatryCloset.Application.Features.Blog.Queries;

// ─── Get Blog Posts (filtered, sorted, paginated) ───

public sealed record GetBlogPostsQuery(
    int Page = 1,
    int PerPage = 6,
    string? Category = null,
    string? Season = null,
    string? Tag = null,
    string? Query = null,
    string Sort = "newest"
) : IRequest<Result<BlogPostListResponse>>;

public sealed class GetBlogPostsQueryValidator : AbstractValidator<GetBlogPostsQuery>
{
    private static readonly string[] AllowedSortFields = ["newest", "oldest", "reading-time"];

    public GetBlogPostsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("La página debe ser mayor o igual a 1");

        RuleFor(x => x.PerPage)
            .InclusiveBetween(1, 50).WithMessage("El tamaño de página debe estar entre 1 y 50");

        RuleFor(x => x.Sort)
            .Must(s => AllowedSortFields.Contains(s.ToLowerInvariant()))
            .WithMessage($"Ordenar por debe ser uno de: {string.Join(", ", AllowedSortFields)}");
    }
}

// ─── Get Blog Post by Slug ───

public sealed record GetBlogPostBySlugQuery(string Slug) : IRequest<Result<BlogPostResponse>>;

// ─── Get Featured Blog Posts ───

public sealed record GetFeaturedBlogPostsQuery() : IRequest<Result<IReadOnlyList<BlogPostResponse>>>;

// ─── Get Related Blog Posts ───

public sealed record GetRelatedBlogPostsQuery(Guid PostId, int Count = 3)
    : IRequest<Result<IReadOnlyList<BlogPostResponse>>>;

using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Blog.DTOs;

namespace PatryCloset.Application.Features.Blog.Queries;

// ─── Get Blog Posts ───

public sealed class GetBlogPostsQueryHandler(IBlogService blogService)
    : IRequestHandler<GetBlogPostsQuery, Result<BlogPostListResponse>>
{
    public Task<Result<BlogPostListResponse>> Handle(
        GetBlogPostsQuery request, CancellationToken ct)
    {
        return blogService.GetPostsAsync(
            request.Page, request.PerPage, request.Category,
            request.Season, request.Tag, request.Query, request.Sort, ct);
    }
}

// ─── Get Blog Post by Slug ───

public sealed class GetBlogPostBySlugQueryHandler(IBlogService blogService)
    : IRequestHandler<GetBlogPostBySlugQuery, Result<BlogPostResponse>>
{
    public Task<Result<BlogPostResponse>> Handle(
        GetBlogPostBySlugQuery request, CancellationToken ct)
    {
        return blogService.GetPostBySlugAsync(request.Slug, ct);
    }
}

// ─── Get Featured Blog Posts ───

public sealed class GetFeaturedBlogPostsQueryHandler(IBlogService blogService)
    : IRequestHandler<GetFeaturedBlogPostsQuery, Result<IReadOnlyList<BlogPostResponse>>>
{
    public Task<Result<IReadOnlyList<BlogPostResponse>>> Handle(
        GetFeaturedBlogPostsQuery request, CancellationToken ct)
    {
        return blogService.GetFeaturedPostsAsync(ct);
    }
}

// ─── Get Related Blog Posts ───

public sealed class GetRelatedBlogPostsQueryHandler(IBlogService blogService)
    : IRequestHandler<GetRelatedBlogPostsQuery, Result<IReadOnlyList<BlogPostResponse>>>
{
    public Task<Result<IReadOnlyList<BlogPostResponse>>> Handle(
        GetRelatedBlogPostsQuery request, CancellationToken ct)
    {
        return blogService.GetRelatedPostsAsync(request.PostId, request.Count, ct);
    }
}

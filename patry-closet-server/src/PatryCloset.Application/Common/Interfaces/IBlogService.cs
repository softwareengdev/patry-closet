using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Blog.DTOs;

namespace PatryCloset.Application.Common.Interfaces;

public interface IBlogService
{
    Task<Result<BlogPostListResponse>> GetPostsAsync(
        int page, int perPage, string? category, string? season,
        string? tag, string? query, string sort, CancellationToken ct = default);

    Task<Result<BlogPostResponse>> GetPostBySlugAsync(string slug, CancellationToken ct = default);

    Task<Result<IReadOnlyList<BlogPostResponse>>> GetFeaturedPostsAsync(CancellationToken ct = default);

    Task<Result<IReadOnlyList<BlogPostResponse>>> GetRelatedPostsAsync(
        Guid postId, int count, CancellationToken ct = default);

    Task<Result<BlogPostResponse>> CreatePostAsync(
        CreateBlogPostRequest request, string userId, CancellationToken ct = default);

    Task<Result<BlogPostResponse>> UpdatePostAsync(
        Guid postId, UpdateBlogPostRequest request, string userId, CancellationToken ct = default);

    Task<Result> DeletePostAsync(Guid postId, CancellationToken ct = default);
}

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Blog.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Infrastructure.Persistence;

namespace PatryCloset.Infrastructure.Services;

public sealed class BlogService(
    ApplicationDbContext context,
    ICacheService cache,
    ILogger<BlogService> logger) : IBlogService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<Result<BlogPostListResponse>> GetPostsAsync(
        int page, int perPage, string? category, string? season,
        string? tag, string? query, string sort, CancellationToken ct = default)
    {
        var cacheKey = $"blog:posts:{category}:{season}:{tag}:{query}:{sort}:{page}:{perPage}";
        if (string.IsNullOrEmpty(query))
        {
            var cached = await cache.GetAsync<BlogPostListResponse>(cacheKey, ct);
            if (cached is not null)
            {
                logger.LogDebug("Cache hit for blog posts: {CacheKey}", cacheKey);
                return Result<BlogPostListResponse>.Success(cached);
            }
        }

        var dbQuery = context.BlogPosts
            .Where(p => p.Published)
            .Include(p => p.Author)
            .AsNoTracking();

        // Filtering
        if (!string.IsNullOrWhiteSpace(category))
            dbQuery = dbQuery.Where(p => p.Category == category);

        if (!string.IsNullOrWhiteSpace(season))
            dbQuery = dbQuery.Where(p => p.Season == season);

        if (!string.IsNullOrWhiteSpace(tag))
            dbQuery = dbQuery.Where(p => p.Tags.Contains(tag));

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.ToLower();
            dbQuery = dbQuery.Where(p =>
                p.Title.ToLower().Contains(term) ||
                p.Excerpt.ToLower().Contains(term));
        }

        // Sorting
        dbQuery = sort.ToLowerInvariant() switch
        {
            "oldest" => dbQuery.OrderBy(p => p.PublishedAt),
            "reading-time" => dbQuery.OrderBy(p => p.ReadingTime),
            _ => dbQuery.OrderByDescending(p => p.PublishedAt), // newest
        };

        var totalCount = await dbQuery.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)perPage);

        var items = await dbQuery
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .ToListAsync(ct);

        var dtos = items.Select(p => MapToDto(p, includeContent: false)).ToList();

        var response = new BlogPostListResponse
        {
            Items = dtos,
            Total = totalCount,
            Page = page,
            PerPage = perPage,
            TotalPages = totalPages,
            HasNextPage = page < totalPages,
            HasPrevPage = page > 1,
            NextPage = page < totalPages ? page + 1 : null,
        };

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5), ct);

        return Result<BlogPostListResponse>.Success(response);
    }

    public async Task<Result<BlogPostResponse>> GetPostBySlugAsync(
        string slug, CancellationToken ct = default)
    {
        var cacheKey = $"blog:post:{slug}";
        var cached = await cache.GetAsync<BlogPostResponse>(cacheKey, ct);
        if (cached is not null)
            return Result<BlogPostResponse>.Success(cached);

        var post = await context.BlogPosts
            .Include(p => p.Author)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.Published, ct);

        if (post is null)
            return Result<BlogPostResponse>.Failure("Artículo no encontrado");

        // Increment view count (fire-and-forget style, tracked entity)
        post.ViewCount++;
        await context.SaveChangesAsync(ct);

        var dto = MapToDto(post, includeContent: true);
        await cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), ct);

        return Result<BlogPostResponse>.Success(dto);
    }

    public async Task<Result<IReadOnlyList<BlogPostResponse>>> GetFeaturedPostsAsync(
        CancellationToken ct = default)
    {
        var cacheKey = "blog:featured";
        var cached = await cache.GetAsync<List<BlogPostResponse>>(cacheKey, ct);
        if (cached is not null)
            return Result<IReadOnlyList<BlogPostResponse>>.Success(cached.AsReadOnly());

        var posts = await context.BlogPosts
            .Where(p => p.Published && p.Featured)
            .Include(p => p.Author)
            .OrderByDescending(p => p.PublishedAt)
            .Take(6)
            .AsNoTracking()
            .ToListAsync(ct);

        var dtos = posts.Select(p => MapToDto(p, includeContent: false)).ToList();
        await cache.SetAsync(cacheKey, dtos, TimeSpan.FromMinutes(15), ct);

        return Result<IReadOnlyList<BlogPostResponse>>.Success(dtos.AsReadOnly());
    }

    public async Task<Result<IReadOnlyList<BlogPostResponse>>> GetRelatedPostsAsync(
        Guid postId, int count, CancellationToken ct = default)
    {
        var cacheKey = $"blog:related:{postId}:{count}";
        var cached = await cache.GetAsync<List<BlogPostResponse>>(cacheKey, ct);
        if (cached is not null)
            return Result<IReadOnlyList<BlogPostResponse>>.Success(cached.AsReadOnly());

        var source = await context.BlogPosts
            .AsNoTracking()
            .Where(p => p.Id == postId)
            .Select(p => new { p.Category, p.Tags })
            .FirstOrDefaultAsync(ct);

        if (source is null)
            return Result<IReadOnlyList<BlogPostResponse>>.Failure("Artículo no encontrado");

        // Find related posts: same category first, then by recency
        var related = await context.BlogPosts
            .Where(p => p.Published && p.Id != postId)
            .Include(p => p.Author)
            .OrderByDescending(p => p.Category == source.Category ? 1 : 0)
            .ThenByDescending(p => p.PublishedAt)
            .Take(count)
            .AsNoTracking()
            .ToListAsync(ct);

        var dtos = related.Select(p => MapToDto(p, includeContent: false)).ToList();
        await cache.SetAsync(cacheKey, dtos, TimeSpan.FromMinutes(10), ct);

        return Result<IReadOnlyList<BlogPostResponse>>.Success(dtos.AsReadOnly());
    }

    public async Task<Result<BlogPostResponse>> CreatePostAsync(
        CreateBlogPostRequest request, string userId, CancellationToken ct = default)
    {
        // Find or create a default author for the admin user
        var author = await context.BlogAuthors.FirstOrDefaultAsync(ct);
        if (author is null)
            return Result<BlogPostResponse>.Failure("No hay autores registrados. Ejecute el seeder.");

        var slug = GenerateSlug(request.Title);
        var slugExists = await context.BlogPosts.AnyAsync(p => p.Slug == slug, ct);
        if (slugExists)
            slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";

        var post = new BlogPost
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Slug = slug,
            Excerpt = request.Excerpt,
            Content = request.Content,
            CoverImage = request.CoverImage,
            CoverImageAlt = request.CoverImageAlt,
            Category = request.Category,
            Season = request.Season,
            Tags = JsonSerializer.Serialize(request.Tags, JsonOptions),
            Badge = request.Badge,
            ReadingTime = request.ReadingTime,
            Featured = request.Featured,
            Trending = request.Trending,
            Published = request.Published,
            PublishedAt = request.Published ? DateTime.UtcNow : null,
            RelatedProductIds = request.RelatedProductIds is not null
                ? JsonSerializer.Serialize(request.RelatedProductIds, JsonOptions)
                : null,
            AuthorId = author.Id,
            CreatedBy = userId,
        };

        context.BlogPosts.Add(post);
        await context.SaveChangesAsync(ct);

        await InvalidateBlogCaches(ct);

        logger.LogInformation("Blog post created: {Title} ({Id})", post.Title, post.Id);

        // Reload with Author
        var created = await context.BlogPosts
            .Include(p => p.Author)
            .AsNoTracking()
            .FirstAsync(p => p.Id == post.Id, ct);

        return Result<BlogPostResponse>.Success(MapToDto(created, includeContent: true));
    }

    public async Task<Result<BlogPostResponse>> UpdatePostAsync(
        Guid postId, UpdateBlogPostRequest request, string userId, CancellationToken ct = default)
    {
        var post = await context.BlogPosts
            .Include(p => p.Author)
            .FirstOrDefaultAsync(p => p.Id == postId, ct);

        if (post is null)
            return Result<BlogPostResponse>.Failure("Artículo no encontrado");

        if (request.Title is not null)
        {
            post.Title = request.Title;
            post.Slug = GenerateSlug(request.Title);
            var slugExists = await context.BlogPosts.AnyAsync(
                p => p.Slug == post.Slug && p.Id != postId, ct);
            if (slugExists)
                post.Slug = $"{post.Slug}-{Guid.NewGuid().ToString()[..6]}";
        }

        if (request.Excerpt is not null) post.Excerpt = request.Excerpt;
        if (request.Content is not null) post.Content = request.Content;
        if (request.CoverImage is not null) post.CoverImage = request.CoverImage;
        if (request.CoverImageAlt is not null) post.CoverImageAlt = request.CoverImageAlt;
        if (request.Category is not null) post.Category = request.Category;
        if (request.Season is not null) post.Season = request.Season;
        if (request.Tags is not null) post.Tags = JsonSerializer.Serialize(request.Tags, JsonOptions);
        if (request.Badge is not null) post.Badge = request.Badge;
        if (request.ReadingTime.HasValue) post.ReadingTime = request.ReadingTime.Value;
        if (request.Featured.HasValue) post.Featured = request.Featured.Value;
        if (request.Trending.HasValue) post.Trending = request.Trending.Value;
        if (request.RelatedProductIds is not null)
            post.RelatedProductIds = JsonSerializer.Serialize(request.RelatedProductIds, JsonOptions);

        if (request.Published.HasValue)
        {
            post.Published = request.Published.Value;
            if (request.Published.Value && post.PublishedAt is null)
                post.PublishedAt = DateTime.UtcNow;
        }

        post.UpdatedBy = userId;

        await context.SaveChangesAsync(ct);
        await InvalidateBlogCaches(ct);
        await cache.RemoveAsync($"blog:post:{post.Slug}", ct);

        logger.LogInformation("Blog post updated: {Title} ({Id})", post.Title, post.Id);

        return Result<BlogPostResponse>.Success(MapToDto(post, includeContent: true));
    }

    public async Task<Result> DeletePostAsync(Guid postId, CancellationToken ct = default)
    {
        var post = await context.BlogPosts.FindAsync([postId], ct);
        if (post is null)
            return Result.Failure("Artículo no encontrado");

        context.BlogPosts.Remove(post);
        await context.SaveChangesAsync(ct);
        await InvalidateBlogCaches(ct);
        await cache.RemoveAsync($"blog:post:{post.Slug}", ct);

        logger.LogInformation("Blog post deleted: {Title} ({Id})", post.Title, post.Id);
        return Result.Success();
    }

    // ─── Helpers ───

    internal static BlogPostResponse MapToDto(BlogPost post, bool includeContent)
    {
        List<string> tags;
        try
        {
            tags = JsonSerializer.Deserialize<List<string>>(post.Tags, JsonOptions) ?? [];
        }
        catch
        {
            tags = [];
        }

        List<int>? relatedProductIds = null;
        if (!string.IsNullOrEmpty(post.RelatedProductIds))
        {
            try
            {
                relatedProductIds = JsonSerializer.Deserialize<List<int>>(post.RelatedProductIds, JsonOptions);
            }
            catch
            {
                relatedProductIds = null;
            }
        }

        return new BlogPostResponse
        {
            Id = post.Id,
            Slug = post.Slug,
            TitleFallback = post.Title,
            ExcerptFallback = post.Excerpt,
            CoverImage = post.CoverImage,
            CoverImageAlt = post.CoverImageAlt,
            Category = post.Category,
            Season = post.Season,
            Tags = tags,
            Author = new BlogAuthorResponse
            {
                Id = post.Author.Id.ToString(),
                Name = post.Author.Name,
                Role = post.Author.Role,
                Avatar = post.Author.AvatarUrl,
            },
            PublishedAt = post.PublishedAt ?? post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            ReadingTime = post.ReadingTime,
            Featured = post.Featured,
            Trending = post.Trending,
            Badge = post.Badge,
            Content = includeContent ? post.Content : null,
            RelatedProductIds = includeContent ? relatedProductIds : null,
        };
    }

    internal static string GenerateSlug(string title) =>
        title.ToLowerInvariant()
            .Replace("á", "a").Replace("é", "e").Replace("í", "i")
            .Replace("ó", "o").Replace("ú", "u").Replace("ñ", "n").Replace("ü", "u")
            .Replace(' ', '-')
            .Where(c => char.IsLetterOrDigit(c) || c == '-')
            .Aggregate("", (current, c) => current + c)
            .Trim('-');

    private async Task InvalidateBlogCaches(CancellationToken ct)
    {
        await cache.RemoveByPrefixAsync("blog:", ct);
    }
}

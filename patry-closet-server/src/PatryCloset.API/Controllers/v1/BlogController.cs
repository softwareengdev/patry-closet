using System.Security.Claims;
using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Blog.Commands;
using PatryCloset.Application.Features.Blog.DTOs;
using PatryCloset.Application.Features.Blog.Queries;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/blog")]
[Produces("application/json")]
[EnableRateLimiting("catalog")]
public sealed class BlogController(ISender mediator) : ControllerBase
{
    /// <summary>Get paginated blog posts with filters.</summary>
    [HttpGet("posts")]
    [OutputCache(PolicyName = "CatalogCache")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostListResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 6,
        [FromQuery] string? category = null,
        [FromQuery] string? season = null,
        [FromQuery] string? tag = null,
        [FromQuery] string? query = null,
        [FromQuery] string sort = "newest",
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetBlogPostsQuery(page, perPage, category, season, tag, query, sort), ct);

        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<BlogPostListResponse>.Ok(result.Value!));
    }

    /// <summary>Get featured blog posts.</summary>
    [HttpGet("posts/featured")]
    [OutputCache(PolicyName = "CatalogCache")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<BlogPostResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeaturedPosts(CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetFeaturedBlogPostsQuery(), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<IReadOnlyList<BlogPostResponse>>.Ok(result.Value!));
    }

    /// <summary>Get blog post by slug.</summary>
    [HttpGet("posts/{slug}")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPostBySlug(string slug, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBlogPostBySlugQuery(slug), ct);
        if (!result.IsSuccess)
            return NotFound(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<BlogPostResponse>.Ok(result.Value!));
    }

    /// <summary>Get related blog posts.</summary>
    [HttpGet("posts/{id:guid}/related")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<BlogPostResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRelatedPosts(
        Guid id, [FromQuery] int count = 3, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetRelatedBlogPostsQuery(id, count), ct);
        if (!result.IsSuccess)
            return NotFound(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<IReadOnlyList<BlogPostResponse>>.Ok(result.Value!));
    }

    // ─── Admin Endpoints ───

    /// <summary>Create a new blog post (Admin only).</summary>
    [HttpPost("posts")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreatePost(
        [FromBody] CreateBlogPostRequest request, CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub") ?? "system";

        var result = await mediator.Send(new CreateBlogPostCommand(request, userId), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));

        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<BlogPostResponse>.Ok(result.Value!, "Artículo creado correctamente"));
    }

    /// <summary>Update a blog post (Admin only).</summary>
    [HttpPut("posts/{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePost(
        Guid id, [FromBody] UpdateBlogPostRequest request, CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub") ?? "system";

        var result = await mediator.Send(new UpdateBlogPostCommand(id, request, userId), ct);
        if (!result.IsSuccess)
            return result.Error == "Artículo no encontrado"
                ? NotFound(ApiResponse<object>.Fail(result.Error))
                : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));

        return Ok(ApiResponse<BlogPostResponse>.Ok(result.Value!, "Artículo actualizado correctamente"));
    }

    /// <summary>Delete a blog post (Admin only).</summary>
    [HttpDelete("posts/{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(Guid id, CancellationToken ct = default)
    {
        var result = await mediator.Send(new DeleteBlogPostCommand(id), ct);
        if (!result.IsSuccess)
            return NotFound(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<object>.Ok(null!, "Artículo eliminado correctamente"));
    }
}

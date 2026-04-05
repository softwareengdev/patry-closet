using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Categories.DTOs;
using PatryCloset.Application.Features.Categories.Queries;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/categories")]
[Produces("application/json")]
[EnableRateLimiting("catalog")]
public sealed class CategoriesController(ISender mediator) : ControllerBase
{
    /// <summary>Get category tree with subcategories and product counts.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(
        [FromQuery] bool includeEmpty = false, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCategoriesQuery(includeEmpty), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<IReadOnlyList<CategoryDto>>.Ok(result.Value!));
    }

    /// <summary>Get single category by slug with product count.</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCategoryBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCategoryBySlugQuery(slug), ct);
        if (!result.IsSuccess)
            return NotFound(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<CategoryDto>.Ok(result.Value!));
    }
}

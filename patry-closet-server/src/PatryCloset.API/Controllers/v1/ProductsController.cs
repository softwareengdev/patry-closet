using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Products.Commands;
using PatryCloset.Application.Features.Products.DTOs;
using PatryCloset.Application.Features.Products.Queries;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/products")]
[Produces("application/json")]
[EnableRateLimiting("catalog")]
public sealed class ProductsController(ISender mediator) : ControllerBase
{
    /// <summary>Get products with filtering, sorting, and pagination.</summary>
    [HttpGet]
    [OutputCache(PolicyName = "CatalogCache")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedList<ProductListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? subcategory,
        [FromQuery] string? brand,
        [FromQuery] string? color,
        [FromQuery] string? size,
        [FromQuery] string? badge,
        [FromQuery] string? gender,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool? inStock,
        [FromQuery] bool? isFeatured,
        [FromQuery] string sortBy = "popularity",
        [FromQuery] string sortDirection = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var filters = new ProductFilterParams
        {
            Search = search,
            Category = category,
            Subcategory = subcategory,
            Brand = brand,
            Color = color,
            Size = size,
            Badge = badge,
            Gender = gender,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            InStock = inStock,
            IsFeatured = isFeatured,
            SortBy = sortBy,
            SortDirection = sortDirection,
            Page = page,
            PageSize = pageSize,
        };

        var result = await mediator.Send(new GetProductsQuery(filters), ct);

        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var paginated = result.Value!;
        return Ok(ApiResponse<IReadOnlyList<ProductListDto>>.Ok(
            paginated.Items,
            new PaginationMeta
            {
                CurrentPage = paginated.PageNumber,
                TotalPages = paginated.TotalPages,
                PageSize = paginated.PageSize,
                TotalCount = paginated.TotalCount,
                HasPrevious = paginated.HasPreviousPage,
                HasNext = paginated.HasNextPage,
            }));
    }

    /// <summary>Get featured products for homepage.</summary>
    [HttpGet("featured")]
    [OutputCache(PolicyName = "CatalogCache")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProductListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeaturedProducts(
        [FromQuery] int count = 12, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetFeaturedProductsQuery(count), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<IReadOnlyList<ProductListDto>>.Ok(result.Value!));
    }

    /// <summary>Get product detail by slug or ID.</summary>
    [HttpGet("{slug}")]
    [OutputCache(PolicyName = "CatalogCache")]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductBySlugQuery(slug), ct);
        if (!result.IsSuccess)
            return NotFound(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<ProductDetailDto>.Ok(result.Value!));
    }

    /// <summary>Get related products based on category/brand similarity.</summary>
    [HttpGet("{id:guid}/related")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProductListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRelatedProducts(
        Guid id, [FromQuery] int count = 8, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetRelatedProductsQuery(id, count), ct);
        if (!result.IsSuccess)
            return NotFound(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<IReadOnlyList<ProductListDto>>.Ok(result.Value!));
    }

    // ─── Admin Endpoints ───

    /// <summary>Create a new product (Admin only).</summary>
    [HttpPost]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateProduct(
        [FromBody] UpsertProductDto product, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateProductCommand(product), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));

        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ProductDetailDto>.Ok(result.Value!, "Producto creado correctamente"));
    }

    /// <summary>Update an existing product (Admin only).</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProduct(
        Guid id, [FromBody] UpsertProductDto product, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateProductCommand(id, product), ct);
        if (!result.IsSuccess)
            return result.Error == "Producto no encontrado"
                ? NotFound(ApiResponse<object>.Fail(result.Error))
                : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));

        return Ok(ApiResponse<ProductDetailDto>.Ok(result.Value!, "Producto actualizado correctamente"));
    }

    /// <summary>Delete a product — soft delete (Admin only).</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteProductCommand(id), ct);
        if (!result.IsSuccess)
            return NotFound(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<object>.Ok(null!, "Producto eliminado correctamente"));
    }
}

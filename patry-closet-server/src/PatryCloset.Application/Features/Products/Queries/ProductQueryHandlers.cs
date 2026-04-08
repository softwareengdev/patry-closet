using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Products.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Products.Queries;

// ─── Get Products (filtered, sorted, paginated) ───

public sealed class GetProductsQueryHandler(
    IRepository<Product> productRepo,
    IRepository<Category> categoryRepo,
    ICacheService cache,
    ILogger<GetProductsQueryHandler> logger)
    : IRequestHandler<GetProductsQuery, Result<PaginatedList<ProductListDto>>>
{
    public async Task<Result<PaginatedList<ProductListDto>>> Handle(
        GetProductsQuery request, CancellationToken ct)
    {
        var f = request.Filters;

        // Try cache for common unfiltered pages
        var cacheKey = $"products:{f.Category}:{f.Subcategory}:{f.SortBy}:{f.SortDirection}:{f.Page}:{f.PageSize}";
        if (string.IsNullOrEmpty(f.Search) && !f.MinPrice.HasValue && !f.MaxPrice.HasValue
            && string.IsNullOrEmpty(f.Color) && string.IsNullOrEmpty(f.Size) && string.IsNullOrEmpty(f.Brand))
        {
            var cached = await cache.GetAsync<PaginatedList<ProductListDto>>(cacheKey, ct);
            if (cached is not null)
            {
                logger.LogDebug("Cache hit for products: {CacheKey}", cacheKey);
                return Result<PaginatedList<ProductListDto>>.Success(cached);
            }
        }

        var query = productRepo.AsQueryable()
            .Where(p => p.IsActive)
            .Include(p => p.Category)
            .ThenInclude(c => c.ParentCategory)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
            .AsNoTracking();

        // ─── Filtering ───
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var term = f.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Description.ToLower().Contains(term) ||
                p.Brand.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(f.Category))
        {
            var catSlug = f.Category.ToLower();
            query = query.Where(p =>
                p.Category.Slug == catSlug ||
                (p.Category.ParentCategory != null && p.Category.ParentCategory.Slug == catSlug));
        }

        if (!string.IsNullOrWhiteSpace(f.Subcategory))
        {
            var subSlug = f.Subcategory.ToLower();
            query = query.Where(p =>
                p.SubcategorySlug == subSlug || p.Category.Slug == subSlug);
        }

        if (!string.IsNullOrWhiteSpace(f.Brand))
            query = query.Where(p => p.Brand.ToLower() == f.Brand.ToLower());

        if (!string.IsNullOrWhiteSpace(f.Color))
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Color.ToLower() == f.Color.ToLower()));

        if (!string.IsNullOrWhiteSpace(f.Size))
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Size.ToLower() == f.Size.ToLower()));

        if (!string.IsNullOrWhiteSpace(f.Badge))
            query = query.Where(p => p.Badge.ToString().ToLower() == f.Badge.ToLower());

        if (!string.IsNullOrWhiteSpace(f.Gender))
            query = query.Where(p => p.Gender.ToString().ToLower() == f.Gender.ToLower());

        if (f.MinPrice.HasValue)
            query = query.Where(p => p.Price >= f.MinPrice.Value);

        if (f.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= f.MaxPrice.Value);

        if (f.InStock == true)
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.StockQuantity > 0));

        if (f.IsFeatured == true)
            query = query.Where(p => p.IsFeatured);

        // ─── Sorting ───
        query = f.SortBy.ToLower() switch
        {
            "price" => f.SortDirection.ToLower() == "asc"
                ? query.OrderBy(p => p.Price)
                : query.OrderByDescending(p => p.Price),
            "name" => f.SortDirection.ToLower() == "asc"
                ? query.OrderBy(p => p.Name)
                : query.OrderByDescending(p => p.Name),
            "rating" => query.OrderByDescending(p => p.Rating),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            "discount" => query.OrderByDescending(p => p.DiscountPercent),
            _ => query.OrderByDescending(p => p.Popularity), // default: popularity
        };

        // ─── Pagination ───
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapToListDto).ToList();
        var result = PaginatedList<ProductListDto>.Create(dtos, totalCount, f.Page, f.PageSize);

        // Cache result
        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), ct);

        return Result<PaginatedList<ProductListDto>>.Success(result);
    }

    internal static ProductListDto MapToListDto(Product p)
    {
        var primaryImage = p.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
        var hoverImage = p.Images.FirstOrDefault(i => i.IsHover) ?? p.Images.OrderBy(i => i.SortOrder).Skip(1).FirstOrDefault();
        var activeVariants = p.Variants.Where(v => v.IsActive).ToList();

        var categoryName = p.Category.ParentCategory?.Name ?? p.Category.Name;

        return new ProductListDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            Price = p.Price,
            OriginalPrice = p.OriginalPrice,
            DiscountPercent = p.DiscountPercent,
            Brand = p.Brand,
            Badge = p.Badge.ToString().ToLower() == "none" ? "" : p.Badge.ToString(),
            Rating = p.Rating,
            ReviewCount = p.ReviewCount,
            Popularity = p.Popularity,
            Category = categoryName,
            Subcategory = p.SubcategorySlug,
            Image = primaryImage?.Url ?? "",
            HoverImage = hoverImage?.Url,
            Colors = activeVariants.Select(v => v.Color).Distinct().ToList().AsReadOnly(),
            Sizes = activeVariants.Select(v => v.Size).Distinct().ToList().AsReadOnly(),
            InStock = activeVariants.Any(v => v.StockQuantity > 0),
            IsFeatured = p.IsFeatured,
        };
    }
}

// ─── Get Product by Slug ───

public sealed class GetProductBySlugQueryHandler(
    IRepository<Product> productRepo,
    ICacheService cache)
    : IRequestHandler<GetProductBySlugQuery, Result<ProductDetailDto>>
{
    public async Task<Result<ProductDetailDto>> Handle(GetProductBySlugQuery request, CancellationToken ct)
    {
        var cacheKey = $"product:{request.Slug}";
        var cached = await cache.GetAsync<ProductDetailDto>(cacheKey, ct);
        if (cached is not null)
            return Result<ProductDetailDto>.Success(cached);

        var product = await productRepo.AsQueryable()
            .Where(p => p.IsActive)
            .Include(p => p.Category).ThenInclude(c => c.ParentCategory)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Include(p => p.Reviews.OrderByDescending(r => r.CreatedAt).Take(5))
                .ThenInclude(r => r.CustomerProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Slug == request.Slug || p.Id.ToString() == request.Slug, ct);

        if (product is null)
            return Result<ProductDetailDto>.Failure("Producto no encontrado");

        var dto = MapToDetailDto(product);
        await cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), ct);

        return Result<ProductDetailDto>.Success(dto);
    }

    internal static ProductDetailDto MapToDetailDto(Product p)
    {
        var activeVariants = p.Variants.Where(v => v.IsActive).ToList();
        var categoryName = p.Category.ParentCategory?.Name ?? p.Category.Name;

        return new ProductDetailDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            Description = p.Description,
            Price = p.Price,
            OriginalPrice = p.OriginalPrice,
            DiscountPercent = p.DiscountPercent,
            Brand = p.Brand,
            Badge = p.Badge.ToString().ToLower() == "none" ? "" : p.Badge.ToString(),
            Rating = p.Rating,
            ReviewCount = p.ReviewCount,
            Popularity = p.Popularity,
            Material = p.Material,
            Gender = p.Gender.ToString(),
            Category = categoryName,
            CategorySlug = p.Category.ParentCategory?.Slug ?? p.Category.Slug,
            Subcategory = p.SubcategorySlug,
            InStock = activeVariants.Any(v => v.StockQuantity > 0),
            IsFeatured = p.IsFeatured,
            CreatedAt = p.CreatedAt,
            Images = p.Images.OrderBy(i => i.SortOrder).Select(i => new ProductImageDto
            {
                Url = i.Url,
                AltText = i.AltText,
                SortOrder = i.SortOrder,
                IsHover = i.IsHover,
            }).ToList().AsReadOnly(),
            Variants = activeVariants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Color = v.Color,
                ColorHex = v.ColorHex,
                Size = v.Size,
                Sku = v.Sku,
                StockQuantity = v.StockQuantity,
                PriceOverride = v.PriceOverride,
                IsActive = v.IsActive,
            }).ToList().AsReadOnly(),
            AvailableColors = activeVariants.Select(v => v.Color).Distinct().ToList().AsReadOnly(),
            AvailableSizes = activeVariants.Select(v => v.Size).Distinct().ToList().AsReadOnly(),
            RecentReviews = p.Reviews.Select(r => new ProductReviewDto
            {
                Id = r.Id,
                AuthorName = r.CustomerProfile != null
                    ? $"{r.CustomerProfile.FirstName} {r.CustomerProfile.LastName?.FirstOrDefault()}."
                    : "Cliente verificado",
                Rating = r.Rating,
                Title = r.Title,
                Comment = r.Comment,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                CreatedAt = r.CreatedAt,
            }).ToList().AsReadOnly(),
        };
    }
}

// ─── Get Featured Products ───

public sealed class GetFeaturedProductsQueryHandler(
    IRepository<Product> productRepo,
    ICacheService cache)
    : IRequestHandler<GetFeaturedProductsQuery, Result<IReadOnlyList<ProductListDto>>>
{
    public async Task<Result<IReadOnlyList<ProductListDto>>> Handle(
        GetFeaturedProductsQuery request, CancellationToken ct)
    {
        var cacheKey = $"products:featured:{request.Count}";
        var cached = await cache.GetAsync<List<ProductListDto>>(cacheKey, ct);
        if (cached is not null)
            return Result<IReadOnlyList<ProductListDto>>.Success(cached.AsReadOnly());

        var products = await productRepo.AsQueryable()
            .Where(p => p.IsActive && p.IsFeatured)
            .Include(p => p.Category).ThenInclude(c => c.ParentCategory)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
            .OrderByDescending(p => p.Popularity)
            .Take(request.Count)
            .AsNoTracking()
            .ToListAsync(ct);

        var dtos = products.Select(GetProductsQueryHandler.MapToListDto).ToList();
        await cache.SetAsync(cacheKey, dtos, TimeSpan.FromMinutes(15), ct);

        return Result<IReadOnlyList<ProductListDto>>.Success(dtos.AsReadOnly());
    }
}

// ─── Get Related Products ───

public sealed class GetRelatedProductsQueryHandler(
    IRepository<Product> productRepo,
    ICacheService cache)
    : IRequestHandler<GetRelatedProductsQuery, Result<IReadOnlyList<ProductListDto>>>
{
    public async Task<Result<IReadOnlyList<ProductListDto>>> Handle(
        GetRelatedProductsQuery request, CancellationToken ct)
    {
        var cacheKey = $"products:related:{request.ProductId}:{request.Count}";
        var cached = await cache.GetAsync<List<ProductListDto>>(cacheKey, ct);
        if (cached is not null)
            return Result<IReadOnlyList<ProductListDto>>.Success(cached.AsReadOnly());

        // Get source product's category
        var source = await productRepo.AsQueryable()
            .AsNoTracking()
            .Where(p => p.Id == request.ProductId)
            .Select(p => new { p.CategoryId, p.SubcategorySlug, p.Brand })
            .FirstOrDefaultAsync(ct);

        if (source is null)
            return Result<IReadOnlyList<ProductListDto>>.Failure("Producto no encontrado");

        // Find related: same subcategory first, then same category, then same brand
        var related = await productRepo.AsQueryable()
            .Where(p => p.IsActive && p.Id != request.ProductId)
            .Include(p => p.Category).ThenInclude(c => c.ParentCategory)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
            .OrderByDescending(p =>
                p.SubcategorySlug == source.SubcategorySlug ? 3 :
                p.CategoryId == source.CategoryId ? 2 :
                p.Brand == source.Brand ? 1 : 0)
            .ThenByDescending(p => p.Popularity)
            .Take(request.Count)
            .AsNoTracking()
            .ToListAsync(ct);

        var dtos = related.Select(GetProductsQueryHandler.MapToListDto).ToList();
        await cache.SetAsync(cacheKey, dtos, TimeSpan.FromMinutes(10), ct);

        return Result<IReadOnlyList<ProductListDto>>.Success(dtos.AsReadOnly());
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Categories.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Categories.Queries;

// ─── Get Categories Tree ───

public sealed class GetCategoriesQueryHandler(
    IRepository<Category> categoryRepo,
    ICacheService cache)
    : IRequestHandler<GetCategoriesQuery, Result<IReadOnlyList<CategoryDto>>>
{
    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(
        GetCategoriesQuery request, CancellationToken ct)
    {
        var cacheKey = $"categories:tree:{request.IncludeEmpty}";
        var cached = await cache.GetAsync<List<CategoryDto>>(cacheKey, ct);
        if (cached is not null)
            return Result<IReadOnlyList<CategoryDto>>.Success(cached.AsReadOnly());

        var allCategories = await categoryRepo.AsQueryable()
            .Where(c => c.IsActive)
            .Include(c => c.Products.Where(p => p.IsActive))
            .AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        // Build tree: parent categories with their children
        var parentCategories = allCategories.Where(c => c.ParentCategoryId == null).ToList();

        var tree = parentCategories.Select(parent =>
        {
            var children = allCategories
                .Where(c => c.ParentCategoryId == parent.Id)
                .OrderBy(c => c.SortOrder)
                .ToList();

            var parentProductCount = children.Sum(c => c.Products.Count) + parent.Products.Count;

            var childDtos = children
                .Where(c => request.IncludeEmpty || c.Products.Count > 0)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    SortOrder = c.SortOrder,
                    ProductCount = c.Products.Count,
                    ParentCategoryId = c.ParentCategoryId,
                    SubCategories = null,
                })
                .ToList();

            return new CategoryDto
            {
                Id = parent.Id,
                Name = parent.Name,
                Slug = parent.Slug,
                Description = parent.Description,
                ImageUrl = parent.ImageUrl,
                SortOrder = parent.SortOrder,
                ProductCount = parentProductCount,
                ParentCategoryId = null,
                SubCategories = childDtos.AsReadOnly(),
            };
        })
        .Where(c => request.IncludeEmpty || c.ProductCount > 0)
        .ToList();

        await cache.SetAsync(cacheKey, tree, TimeSpan.FromMinutes(30), ct);

        return Result<IReadOnlyList<CategoryDto>>.Success(tree.AsReadOnly());
    }
}

// ─── Get Category by Slug ───

public sealed class GetCategoryBySlugQueryHandler(
    IRepository<Category> categoryRepo,
    ICacheService cache)
    : IRequestHandler<GetCategoryBySlugQuery, Result<CategoryDto>>
{
    public async Task<Result<CategoryDto>> Handle(GetCategoryBySlugQuery request, CancellationToken ct)
    {
        var cacheKey = $"category:{request.Slug}";
        var cached = await cache.GetAsync<CategoryDto>(cacheKey, ct);
        if (cached is not null)
            return Result<CategoryDto>.Success(cached);

        var category = await categoryRepo.AsQueryable()
            .Where(c => c.IsActive && c.Slug == request.Slug)
            .Include(c => c.SubCategories.Where(s => s.IsActive))
            .ThenInclude(s => s.Products.Where(p => p.IsActive))
            .Include(c => c.Products.Where(p => p.IsActive))
            .AsNoTracking()
            .FirstOrDefaultAsync(ct);

        if (category is null)
            return Result<CategoryDto>.Failure("Categoría no encontrada");

        var dto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            SortOrder = category.SortOrder,
            ProductCount = category.Products.Count + category.SubCategories.Sum(s => s.Products.Count),
            ParentCategoryId = category.ParentCategoryId,
            SubCategories = category.SubCategories
                .OrderBy(s => s.SortOrder)
                .Select(s => new CategoryDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Slug = s.Slug,
                    Description = s.Description,
                    ImageUrl = s.ImageUrl,
                    SortOrder = s.SortOrder,
                    ProductCount = s.Products.Count,
                    ParentCategoryId = s.ParentCategoryId,
                    SubCategories = null,
                }).ToList().AsReadOnly(),
        };

        await cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(30), ct);

        return Result<CategoryDto>.Success(dto);
    }
}

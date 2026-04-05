using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Products.DTOs;
using PatryCloset.Application.Features.Products.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Exceptions;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Products.Commands;

// ─── Create Product ───

public sealed class CreateProductCommandHandler(
    IRepository<Product> productRepo,
    IRepository<Category> categoryRepo,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<CreateProductCommandHandler> logger)
    : IRequestHandler<CreateProductCommand, Result<ProductDetailDto>>
{
    public async Task<Result<ProductDetailDto>> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var dto = request.Product;

        // Verify category exists
        var category = await categoryRepo.GetByIdAsync(dto.CategoryId, ct);
        if (category is null)
            return Result<ProductDetailDto>.Failure("Categoría no encontrada");

        // Check slug uniqueness
        var slug = ProductCommandHelpers.GenerateSlug(dto.Name);
        var slugExists = await productRepo.AsQueryable().AnyAsync(p => p.Slug == slug, ct);
        if (slugExists)
            slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Slug = slug,
            Description = dto.Description,
            Price = dto.Price,
            OriginalPrice = dto.OriginalPrice,
            DiscountPercent = dto.DiscountPercent,
            Brand = dto.Brand,
            Badge = ProductCommandHelpers.ParseBadge(dto.Badge),
            Material = dto.Material,
            Gender = ProductCommandHelpers.ParseGender(dto.Gender),
            CategoryId = dto.CategoryId,
            SubcategorySlug = dto.SubcategorySlug,
            IsFeatured = dto.IsFeatured,
            IsActive = true,
            Rating = 0,
            ReviewCount = 0,
            Popularity = 0,
        };

        foreach (var img in dto.Images)
        {
            product.Images.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                Url = img.Url,
                AltText = img.AltText,
                SortOrder = img.SortOrder,
                IsHover = img.IsHover,
                ProductId = product.Id,
            });
        }

        foreach (var v in dto.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                Color = v.Color,
                ColorHex = v.ColorHex,
                Size = v.Size,
                Sku = v.Sku,
                StockQuantity = v.StockQuantity,
                PriceOverride = v.PriceOverride,
                IsActive = true,
                ProductId = product.Id,
            });
        }

        await productRepo.AddAsync(product, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await ProductCommandHelpers.InvalidateProductCaches(cache, ct);

        logger.LogInformation("Product created: {Name} ({Id})", product.Name, product.Id);

        // Reload with navigation properties for mapping
        var created = await productRepo.AsQueryable()
            .Include(p => p.Category).ThenInclude(c => c.ParentCategory)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
            .AsNoTracking()
            .FirstAsync(p => p.Id == product.Id, ct);

        return Result<ProductDetailDto>.Success(GetProductBySlugQueryHandler.MapToDetailDto(created));
    }
}

// ─── Update Product ───

public sealed class UpdateProductCommandHandler(
    IRepository<Product> productRepo,
    IRepository<Category> categoryRepo,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<UpdateProductCommandHandler> logger)
    : IRequestHandler<UpdateProductCommand, Result<ProductDetailDto>>
{
    public async Task<Result<ProductDetailDto>> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await productRepo.AsQueryable()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == request.Id, ct);

        if (product is null || !product.IsActive)
            return Result<ProductDetailDto>.Failure("Producto no encontrado");

        var dto = request.Product;

        // Verify category
        var category = await categoryRepo.GetByIdAsync(dto.CategoryId, ct);
        if (category is null)
            return Result<ProductDetailDto>.Failure("Categoría no encontrada");

        // Update scalar properties
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.OriginalPrice = dto.OriginalPrice;
        product.DiscountPercent = dto.DiscountPercent;
        product.Brand = dto.Brand;
        product.Badge = ProductCommandHelpers.ParseBadge(dto.Badge);
        product.Material = dto.Material;
        product.Gender = ProductCommandHelpers.ParseGender(dto.Gender);
        product.CategoryId = dto.CategoryId;
        product.SubcategorySlug = dto.SubcategorySlug;
        product.IsFeatured = dto.IsFeatured;

        // Replace images: clear old, add new
        product.Images.Clear();
        foreach (var img in dto.Images)
        {
            product.Images.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                Url = img.Url,
                AltText = img.AltText,
                SortOrder = img.SortOrder,
                IsHover = img.IsHover,
                ProductId = product.Id,
            });
        }

        // Replace variants: clear old, add new
        product.Variants.Clear();
        foreach (var v in dto.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                Color = v.Color,
                ColorHex = v.ColorHex,
                Size = v.Size,
                Sku = v.Sku,
                StockQuantity = v.StockQuantity,
                PriceOverride = v.PriceOverride,
                IsActive = true,
                ProductId = product.Id,
            });
        }

        await unitOfWork.SaveChangesAsync(ct);

        await ProductCommandHelpers.InvalidateProductCaches(cache, ct);
        await cache.RemoveAsync($"product:{product.Slug}", ct);

        logger.LogInformation("Product updated: {Name} ({Id})", product.Name, product.Id);

        // Reload for mapping
        var updated = await productRepo.AsQueryable()
            .Include(p => p.Category).ThenInclude(c => c.ParentCategory)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
            .AsNoTracking()
            .FirstAsync(p => p.Id == product.Id, ct);

        return Result<ProductDetailDto>.Success(GetProductBySlugQueryHandler.MapToDetailDto(updated));
    }
}

// ─── Delete Product (soft delete) ───

public sealed class DeleteProductCommandHandler(
    IRepository<Product> productRepo,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<DeleteProductCommandHandler> logger)
    : IRequestHandler<DeleteProductCommand, Result>
{
    public async Task<Result> Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await productRepo.GetByIdAsync(request.Id, ct);
        if (product is null || !product.IsActive)
            return Result.Failure("Producto no encontrado");

        product.IsActive = false; // soft delete
        await unitOfWork.SaveChangesAsync(ct);

        await ProductCommandHelpers.InvalidateProductCaches(cache, ct);
        await cache.RemoveAsync($"product:{product.Slug}", ct);

        logger.LogInformation("Product soft-deleted: {Name} ({Id})", product.Name, product.Id);
        return Result.Success();
    }
}

// ─── Shared Helpers ───

internal static class ProductCommandHelpers
{
    internal static string GenerateSlug(string name) =>
        name.ToLowerInvariant()
            .Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u")
            .Replace("ñ", "n").Replace("ü", "u")
            .Replace(' ', '-')
            .Where(c => char.IsLetterOrDigit(c) || c == '-')
            .Aggregate("", (current, c) => current + c)
            .Trim('-');

    internal static ProductBadge ParseBadge(string? badge) => badge?.ToLower() switch
    {
        "new" => ProductBadge.New,
        "trending" => ProductBadge.Trending,
        "bestseller" => ProductBadge.BestSeller,
        "limited" => ProductBadge.Limited,
        "onsale" => ProductBadge.OnSale,
        _ => ProductBadge.None,
    };

    internal static Gender ParseGender(string? gender) => gender?.ToLower() switch
    {
        "male" or "hombre" or "hombres" => Gender.Male,
        "female" or "mujer" or "mujeres" => Gender.Female,
        "kids" or "niños" => Gender.Kids,
        _ => Gender.Unisex,
    };

    internal static async Task InvalidateProductCaches(ICacheService cache, CancellationToken ct)
    {
        await cache.RemoveByPrefixAsync("products:", ct);
        await cache.RemoveByPrefixAsync("categories:", ct);
    }
}

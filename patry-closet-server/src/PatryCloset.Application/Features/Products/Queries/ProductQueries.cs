using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Products.DTOs;

namespace PatryCloset.Application.Features.Products.Queries;

// ─── Get Products (filtered, sorted, paginated) ───

public sealed record GetProductsQuery(ProductFilterParams Filters)
    : IRequest<Result<PaginatedList<ProductListDto>>>;

public sealed class GetProductsQueryValidator : AbstractValidator<GetProductsQuery>
{
    private static readonly string[] AllowedSortFields =
        ["price", "name", "popularity", "rating", "newest", "discount"];

    public GetProductsQueryValidator()
    {
        RuleFor(x => x.Filters.Page)
            .GreaterThanOrEqualTo(1).WithMessage("La página debe ser mayor o igual a 1");

        RuleFor(x => x.Filters.PageSize)
            .InclusiveBetween(1, 100).WithMessage("El tamaño de página debe estar entre 1 y 100");

        RuleFor(x => x.Filters.MinPrice)
            .GreaterThanOrEqualTo(0).When(x => x.Filters.MinPrice.HasValue)
            .WithMessage("El precio mínimo debe ser positivo");

        RuleFor(x => x.Filters.MaxPrice)
            .GreaterThan(x => x.Filters.MinPrice ?? 0).When(x => x.Filters.MaxPrice.HasValue)
            .WithMessage("El precio máximo debe ser mayor que el mínimo");

        RuleFor(x => x.Filters.SortBy)
            .Must(s => AllowedSortFields.Contains(s.ToLowerInvariant()))
            .WithMessage($"Ordenar por debe ser uno de: {string.Join(", ", AllowedSortFields)}");
    }
}

// ─── Get Product by ID or Slug ───

public sealed record GetProductBySlugQuery(string Slug) : IRequest<Result<ProductDetailDto>>;

// ─── Get Featured Products ───

public sealed record GetFeaturedProductsQuery(int Count = 12) : IRequest<Result<IReadOnlyList<ProductListDto>>>;

// ─── Get Related Products ───

public sealed record GetRelatedProductsQuery(Guid ProductId, int Count = 8)
    : IRequest<Result<IReadOnlyList<ProductListDto>>>;

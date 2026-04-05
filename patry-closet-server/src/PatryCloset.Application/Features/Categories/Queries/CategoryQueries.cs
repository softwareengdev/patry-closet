using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Categories.DTOs;

namespace PatryCloset.Application.Features.Categories.Queries;

/// <summary>Get full category tree with subcategories and product counts.</summary>
public sealed record GetCategoriesQuery(bool IncludeEmpty = false)
    : IRequest<Result<IReadOnlyList<CategoryDto>>>;

/// <summary>Get single category by slug with its products count.</summary>
public sealed record GetCategoryBySlugQuery(string Slug)
    : IRequest<Result<CategoryDto>>;

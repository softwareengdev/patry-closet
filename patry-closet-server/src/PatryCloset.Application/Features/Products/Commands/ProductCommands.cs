using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Products.DTOs;

namespace PatryCloset.Application.Features.Products.Commands;

// ─── Create Product ───

public sealed record CreateProductCommand(UpsertProductDto Product) : IRequest<Result<ProductDetailDto>>;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Product.Name)
            .NotEmpty().WithMessage("El nombre es obligatorio")
            .MaximumLength(256);

        RuleFor(x => x.Product.Description)
            .NotEmpty().WithMessage("La descripción es obligatoria")
            .MaximumLength(4000);

        RuleFor(x => x.Product.Price)
            .GreaterThan(0).WithMessage("El precio debe ser mayor que 0");

        RuleFor(x => x.Product.OriginalPrice)
            .GreaterThan(x => x.Product.Price).When(x => x.Product.OriginalPrice.HasValue)
            .WithMessage("El precio original debe ser mayor que el precio de venta");

        RuleFor(x => x.Product.Brand)
            .NotEmpty().WithMessage("La marca es obligatoria")
            .MaximumLength(128);

        RuleFor(x => x.Product.CategoryId)
            .NotEmpty().WithMessage("La categoría es obligatoria");

        RuleFor(x => x.Product.Images)
            .NotEmpty().WithMessage("Al menos una imagen es obligatoria");

        RuleFor(x => x.Product.Variants)
            .NotEmpty().WithMessage("Al menos una variante (talla/color) es obligatoria");

        RuleForEach(x => x.Product.Images).ChildRules(img =>
        {
            img.RuleFor(i => i.Url).NotEmpty().WithMessage("La URL de la imagen es obligatoria");
        });

        RuleForEach(x => x.Product.Variants).ChildRules(v =>
        {
            v.RuleFor(i => i.Color).NotEmpty().WithMessage("El color es obligatorio");
            v.RuleFor(i => i.Size).NotEmpty().WithMessage("La talla es obligatoria");
            v.RuleFor(i => i.Sku).NotEmpty().WithMessage("El SKU es obligatorio");
            v.RuleFor(i => i.StockQuantity).GreaterThanOrEqualTo(0).WithMessage("El stock no puede ser negativo");
        });
    }
}

// ─── Update Product ───

public sealed record UpdateProductCommand(Guid Id, UpsertProductDto Product) : IRequest<Result<ProductDetailDto>>;

public sealed class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("El ID del producto es obligatorio");

        RuleFor(x => x.Product.Name)
            .NotEmpty().WithMessage("El nombre es obligatorio")
            .MaximumLength(256);

        RuleFor(x => x.Product.Description)
            .NotEmpty().WithMessage("La descripción es obligatoria")
            .MaximumLength(4000);

        RuleFor(x => x.Product.Price)
            .GreaterThan(0).WithMessage("El precio debe ser mayor que 0");

        RuleFor(x => x.Product.OriginalPrice)
            .GreaterThan(x => x.Product.Price).When(x => x.Product.OriginalPrice.HasValue)
            .WithMessage("El precio original debe ser mayor que el precio de venta");

        RuleFor(x => x.Product.Brand)
            .NotEmpty().WithMessage("La marca es obligatoria")
            .MaximumLength(128);

        RuleFor(x => x.Product.CategoryId)
            .NotEmpty().WithMessage("La categoría es obligatoria");

        RuleFor(x => x.Product.Images)
            .NotEmpty().WithMessage("Al menos una imagen es obligatoria");

        RuleFor(x => x.Product.Variants)
            .NotEmpty().WithMessage("Al menos una variante (talla/color) es obligatoria");

        RuleForEach(x => x.Product.Images).ChildRules(img =>
        {
            img.RuleFor(i => i.Url).NotEmpty().WithMessage("La URL de la imagen es obligatoria");
        });

        RuleForEach(x => x.Product.Variants).ChildRules(v =>
        {
            v.RuleFor(i => i.Color).NotEmpty().WithMessage("El color es obligatorio");
            v.RuleFor(i => i.Size).NotEmpty().WithMessage("La talla es obligatoria");
            v.RuleFor(i => i.Sku).NotEmpty().WithMessage("El SKU es obligatorio");
            v.RuleFor(i => i.StockQuantity).GreaterThanOrEqualTo(0).WithMessage("El stock no puede ser negativo");
        });
    }
}

// ─── Delete Product (soft delete) ───

public sealed record DeleteProductCommand(Guid Id) : IRequest<Result>;

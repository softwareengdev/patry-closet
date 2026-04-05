using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Addresses.DTOs;

namespace PatryCloset.Application.Features.Addresses.Commands;

// ─── Create Address ───

public sealed record CreateAddressCommand(Guid CustomerProfileId, UpsertAddressRequest Address)
    : IRequest<Result<AddressDto>>;

public sealed class CreateAddressCommandValidator : AbstractValidator<CreateAddressCommand>
{
    public CreateAddressCommandValidator()
    {
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.Address.FullName).NotEmpty().WithMessage("El nombre completo es obligatorio").MaximumLength(200);
        RuleFor(x => x.Address.Street).NotEmpty().WithMessage("La calle es obligatoria").MaximumLength(300);
        RuleFor(x => x.Address.City).NotEmpty().WithMessage("La ciudad es obligatoria").MaximumLength(100);
        RuleFor(x => x.Address.Province).NotEmpty().WithMessage("La provincia es obligatoria").MaximumLength(100);
        RuleFor(x => x.Address.PostalCode).NotEmpty().WithMessage("El código postal es obligatorio")
            .Matches(@"^\d{5}$").WithMessage("Código postal inválido (5 dígitos)");
        RuleFor(x => x.Address.Country).NotEmpty().MaximumLength(2);
        RuleFor(x => x.Address.Phone).MaximumLength(20).When(x => x.Address.Phone is not null);
    }
}

// ─── Update Address ───

public sealed record UpdateAddressCommand(Guid AddressId, Guid CustomerProfileId, UpsertAddressRequest Address)
    : IRequest<Result<AddressDto>>;

public sealed class UpdateAddressCommandValidator : AbstractValidator<UpdateAddressCommand>
{
    public UpdateAddressCommandValidator()
    {
        RuleFor(x => x.AddressId).NotEmpty();
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.Address.FullName).NotEmpty().WithMessage("El nombre completo es obligatorio").MaximumLength(200);
        RuleFor(x => x.Address.Street).NotEmpty().WithMessage("La calle es obligatoria").MaximumLength(300);
        RuleFor(x => x.Address.City).NotEmpty().WithMessage("La ciudad es obligatoria").MaximumLength(100);
        RuleFor(x => x.Address.Province).NotEmpty().WithMessage("La provincia es obligatoria").MaximumLength(100);
        RuleFor(x => x.Address.PostalCode).NotEmpty().WithMessage("El código postal es obligatorio")
            .Matches(@"^\d{5}$").WithMessage("Código postal inválido (5 dígitos)");
    }
}

// ─── Delete Address ───

public sealed record DeleteAddressCommand(Guid AddressId, Guid CustomerProfileId) : IRequest<Result>;

// ─── Set Default Address ───

public sealed record SetDefaultAddressCommand(Guid AddressId, Guid CustomerProfileId) : IRequest<Result>;

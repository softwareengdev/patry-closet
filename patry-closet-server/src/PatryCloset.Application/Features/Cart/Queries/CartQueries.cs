using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Cart.DTOs;

namespace PatryCloset.Application.Features.Cart.Queries;

public sealed record GetCartQuery(Guid? CustomerProfileId, string? SessionId)
    : IRequest<Result<CartDto>>;

public sealed class GetCartQueryValidator : AbstractValidator<GetCartQuery>
{
    public GetCartQueryValidator()
    {
        RuleFor(x => x)
            .Must(x => x.CustomerProfileId.HasValue || !string.IsNullOrEmpty(x.SessionId))
            .WithMessage("Se requiere un usuario autenticado o un ID de sesión");
    }
}

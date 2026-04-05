using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Addresses.DTOs;

namespace PatryCloset.Application.Features.Addresses.Queries;

public sealed record GetAddressesQuery(Guid CustomerProfileId)
    : IRequest<Result<IReadOnlyList<AddressDto>>>;

public sealed record GetAddressByIdQuery(Guid AddressId, Guid CustomerProfileId)
    : IRequest<Result<AddressDto>>;

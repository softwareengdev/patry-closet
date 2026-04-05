using MediatR;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Addresses.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Addresses.Queries;

public sealed class GetAddressesQueryHandler(
    IRepository<Address> addressRepo)
    : IRequestHandler<GetAddressesQuery, Result<IReadOnlyList<AddressDto>>>
{
    public async Task<Result<IReadOnlyList<AddressDto>>> Handle(GetAddressesQuery request, CancellationToken ct)
    {
        var addresses = await addressRepo.AsQueryable()
            .Where(a => a.CustomerProfileId == request.CustomerProfileId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        var dtos = addresses.Select(AddressMapper.MapToDto).ToList();
        return Result<IReadOnlyList<AddressDto>>.Success(dtos.AsReadOnly());
    }
}

public sealed class GetAddressByIdQueryHandler(
    IRepository<Address> addressRepo)
    : IRequestHandler<GetAddressByIdQuery, Result<AddressDto>>
{
    public async Task<Result<AddressDto>> Handle(GetAddressByIdQuery request, CancellationToken ct)
    {
        var address = await addressRepo.AsQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.Id == request.AddressId &&
                a.CustomerProfileId == request.CustomerProfileId, ct);

        if (address is null)
            return Result<AddressDto>.Failure("Dirección no encontrada");

        return Result<AddressDto>.Success(AddressMapper.MapToDto(address));
    }
}

internal static class AddressMapper
{
    internal static AddressDto MapToDto(Address a) => new()
    {
        Id = a.Id,
        Label = a.Label,
        FullName = a.FullName,
        Street = a.Street,
        Street2 = a.Street2,
        City = a.City,
        Province = a.Province,
        PostalCode = a.PostalCode,
        Country = a.Country,
        Phone = a.Phone,
        IsDefault = a.IsDefault,
    };
}

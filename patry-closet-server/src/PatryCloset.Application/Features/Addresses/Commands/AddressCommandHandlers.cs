using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Addresses.DTOs;
using PatryCloset.Application.Features.Addresses.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Addresses.Commands;

// ─── Create Address ───

public sealed class CreateAddressCommandHandler(
    IRepository<Address> addressRepo,
    IUnitOfWork unitOfWork,
    ILogger<CreateAddressCommandHandler> logger)
    : IRequestHandler<CreateAddressCommand, Result<AddressDto>>
{
    public async Task<Result<AddressDto>> Handle(CreateAddressCommand request, CancellationToken ct)
    {
        var dto = request.Address;

        // Max 10 addresses per customer
        var count = await addressRepo.CountAsync(
            a => a.CustomerProfileId == request.CustomerProfileId, ct);
        if (count >= 10)
            return Result<AddressDto>.Failure("Máximo 10 direcciones permitidas");

        // If this is default, unset others
        if (dto.IsDefault)
        {
            await UnsetDefaultAddresses(addressRepo, unitOfWork, request.CustomerProfileId, ct);
        }

        // If first address, make it default
        var isFirst = count == 0;

        var address = new Address
        {
            Id = Guid.NewGuid(),
            Label = dto.Label,
            FullName = dto.FullName,
            Street = dto.Street,
            Street2 = dto.Street2,
            City = dto.City,
            Province = dto.Province,
            PostalCode = dto.PostalCode,
            Country = dto.Country,
            Phone = dto.Phone,
            IsDefault = dto.IsDefault || isFirst,
            CustomerProfileId = request.CustomerProfileId,
        };

        await addressRepo.AddAsync(address, ct);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Address created for customer {CustomerId}", request.CustomerProfileId);
        return Result<AddressDto>.Success(AddressMapper.MapToDto(address));
    }

    internal static async Task UnsetDefaultAddresses(
        IRepository<Address> addressRepo, IUnitOfWork unitOfWork,
        Guid customerProfileId, CancellationToken ct)
    {
        var defaults = await addressRepo.AsQueryable()
            .Where(a => a.CustomerProfileId == customerProfileId && a.IsDefault)
            .ToListAsync(ct);

        foreach (var a in defaults) a.IsDefault = false;
    }
}

// ─── Update Address ───

public sealed class UpdateAddressCommandHandler(
    IRepository<Address> addressRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateAddressCommand, Result<AddressDto>>
{
    public async Task<Result<AddressDto>> Handle(UpdateAddressCommand request, CancellationToken ct)
    {
        var address = await addressRepo.AsQueryable()
            .FirstOrDefaultAsync(a =>
                a.Id == request.AddressId &&
                a.CustomerProfileId == request.CustomerProfileId, ct);

        if (address is null)
            return Result<AddressDto>.Failure("Dirección no encontrada");

        var dto = request.Address;

        if (dto.IsDefault && !address.IsDefault)
        {
            await CreateAddressCommandHandler.UnsetDefaultAddresses(
                addressRepo, unitOfWork, request.CustomerProfileId, ct);
        }

        address.Label = dto.Label;
        address.FullName = dto.FullName;
        address.Street = dto.Street;
        address.Street2 = dto.Street2;
        address.City = dto.City;
        address.Province = dto.Province;
        address.PostalCode = dto.PostalCode;
        address.Country = dto.Country;
        address.Phone = dto.Phone;
        address.IsDefault = dto.IsDefault;

        await unitOfWork.SaveChangesAsync(ct);
        return Result<AddressDto>.Success(AddressMapper.MapToDto(address));
    }
}

// ─── Delete Address ───

public sealed class DeleteAddressCommandHandler(
    IRepository<Address> addressRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteAddressCommand, Result>
{
    public async Task<Result> Handle(DeleteAddressCommand request, CancellationToken ct)
    {
        var address = await addressRepo.AsQueryable()
            .FirstOrDefaultAsync(a =>
                a.Id == request.AddressId &&
                a.CustomerProfileId == request.CustomerProfileId, ct);

        if (address is null)
            return Result.Failure("Dirección no encontrada");

        await addressRepo.DeleteAsync(address, ct);

        // If was default, make the newest remaining address default
        if (address.IsDefault)
        {
            var newest = await addressRepo.AsQueryable()
                .Where(a => a.CustomerProfileId == request.CustomerProfileId)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (newest is not null)
                newest.IsDefault = true;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ─── Set Default Address ───

public sealed class SetDefaultAddressCommandHandler(
    IRepository<Address> addressRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<SetDefaultAddressCommand, Result>
{
    public async Task<Result> Handle(SetDefaultAddressCommand request, CancellationToken ct)
    {
        var address = await addressRepo.AsQueryable()
            .FirstOrDefaultAsync(a =>
                a.Id == request.AddressId &&
                a.CustomerProfileId == request.CustomerProfileId, ct);

        if (address is null)
            return Result.Failure("Dirección no encontrada");

        await CreateAddressCommandHandler.UnsetDefaultAddresses(
            addressRepo, unitOfWork, request.CustomerProfileId, ct);

        address.IsDefault = true;
        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}

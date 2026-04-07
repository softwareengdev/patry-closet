using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Addresses.Commands;
using PatryCloset.Application.Features.Addresses.DTOs;
using PatryCloset.Application.Features.Addresses.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/addresses")]
[Authorize]
[Produces("application/json")]
[EnableRateLimiting("write")]
public sealed class AddressesController(ISender mediator, IRepository<CustomerProfile> profileRepo) : ControllerBase
{
    /// <summary>Get all addresses for current user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AddressDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAddresses(CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new GetAddressesQuery(profileId.Value), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<IReadOnlyList<AddressDto>>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Get single address.</summary>
    [HttpGet("{addressId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAddress(Guid addressId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new GetAddressByIdQuery(addressId, profileId.Value), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<AddressDto>.Ok(result.Value!))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Create a new address.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AddressDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAddress([FromBody] UpsertAddressRequest request, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new CreateAddressCommand(profileId.Value, request), ct);
        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created,
                ApiResponse<AddressDto>.Ok(result.Value!, "Dirección creada correctamente"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
    }

    /// <summary>Update an existing address.</summary>
    [HttpPut("{addressId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAddress(
        Guid addressId, [FromBody] UpsertAddressRequest request, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new UpdateAddressCommand(addressId, profileId.Value, request), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<AddressDto>.Ok(result.Value!, "Dirección actualizada"))
            : result.Error == "Dirección no encontrada"
                ? NotFound(ApiResponse<object>.Fail(result.Error))
                : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
    }

    /// <summary>Delete an address.</summary>
    [HttpDelete("{addressId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAddress(Guid addressId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new DeleteAddressCommand(addressId, profileId.Value), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Dirección eliminada"))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Set address as default.</summary>
    [HttpPost("{addressId:guid}/default")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetDefault(Guid addressId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new SetDefaultAddressCommand(addressId, profileId.Value), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Dirección establecida como predeterminada"))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }

    private async Task<Guid?> GetProfileId(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(userId)) return null;

        var profile = await profileRepo.AsQueryable()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (profile is null)
        {
            var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
            profile = new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FirstName = email?.Split('@')[0] ?? "User",
                LastName = "",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
            };
            await profileRepo.AddAsync(profile, ct);
        }

        return profile.Id;
    }
}

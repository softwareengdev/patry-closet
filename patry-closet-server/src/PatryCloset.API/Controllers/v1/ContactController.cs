using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Contact.Commands;
using PatryCloset.Application.Features.Contact.DTOs;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/contact")]
[Produces("application/json")]
public sealed class ContactController(ISender mediator) : ControllerBase
{
    /// <summary>Submit a contact form.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ContactResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitContact(
        [FromBody] SubmitContactRequest request,
        CancellationToken ct)
    {

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        // File attachments placeholder — will integrate with IFileStorageService later
        var attachmentUrls = new List<string>();

        var command = new SubmitContactCommand(
            request.Name, request.Email, request.Phone, request.Subject,
            request.Message, request.RecaptchaToken, ip, ua, userId, attachmentUrls);

        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<ContactResponse>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }
}

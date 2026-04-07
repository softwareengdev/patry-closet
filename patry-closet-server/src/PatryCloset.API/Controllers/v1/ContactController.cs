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
public sealed class ContactController(ISender mediator, IWebHostEnvironment env) : ControllerBase
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    /// <summary>Submit a contact form (accepts JSON or multipart/form-data with attachments).</summary>
    [HttpPost]
    [Consumes("multipart/form-data", "application/json")]
    [RequestSizeLimit(20_000_000)] // 20 MB total
    [ProducesResponseType(typeof(ApiResponse<ContactResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitContact(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        string name, email, subject, message;
        string? phone = null, recaptchaToken = null;
        var attachmentUrls = new List<string>();

        if (Request.ContentType?.Contains("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true)
        {
            var form = await Request.ReadFormAsync(ct);
            name = form["name"].ToString();
            email = form["email"].ToString();
            phone = form["phone"].ToString();
            subject = form["subject"].ToString();
            message = form["message"].ToString();
            recaptchaToken = form["recaptchaToken"].ToString();

            // Process file attachments (up to 3 images)
            var fileKeys = form.Files.Where(f => f.Name.StartsWith("attachment_")).Take(3);
            foreach (var file in fileKeys)
            {
                if (file.Length == 0 || file.Length > MaxFileSize) continue;
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedExtensions.Contains(ext)) continue;

                var fileName = $"contact/{Guid.NewGuid():N}{ext}";
                var uploadsDir = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "contact");
                Directory.CreateDirectory(uploadsDir);
                var filePath = Path.Combine(uploadsDir, $"{Guid.NewGuid():N}{ext}");

                await using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream, ct);
                attachmentUrls.Add($"/uploads/{fileName}");
            }
        }
        else
        {
            var request = await System.Text.Json.JsonSerializer.DeserializeAsync<SubmitContactRequest>(
                Request.Body, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct);
            if (request is null)
                return BadRequest(ApiResponse<object>.Fail("Invalid request body"));

            name = request.Name;
            email = request.Email;
            phone = request.Phone;
            subject = request.Subject;
            message = request.Message;
            recaptchaToken = request.RecaptchaToken;
        }

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(message))
            return BadRequest(ApiResponse<object>.Fail("Name, email, subject and message are required"));

        var command = new SubmitContactCommand(
            name, email, phone, subject, message, recaptchaToken, ip, ua, userId, attachmentUrls);

        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<ContactResponse>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }
}

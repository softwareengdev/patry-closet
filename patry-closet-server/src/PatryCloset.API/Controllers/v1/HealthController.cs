using Microsoft.AspNetCore.Mvc;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Asp.Versioning.ApiVersion("1.0")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "Patry Closet API",
            version = "1.0.0",
            timestamp = DateTime.UtcNow,
        });
    }
}

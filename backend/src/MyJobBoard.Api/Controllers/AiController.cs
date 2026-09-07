using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyJobBoard.Api.Services;
using MyJobBoard.Application.Common.Interfaces;

namespace MyJobBoard.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly ICurrentUserService _currentUserService;

    public AiController(IAiService aiService, ICurrentUserService currentUserService)
    {
        _aiService = aiService;
        _currentUserService = currentUserService;
    }

    [HttpPost("generate-company-summary")]
    public async Task<IActionResult> GenerateCompanySummary([FromBody] AiCompanyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName))
        {
            return BadRequest("Company name is required.");
        }

        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _aiService.GenerateCompanySummaryAsync(request.CompanyName, userId);
            return Content(result, "application/json"); // Returns raw JSON
        }
        catch (System.Exception ex)
        {
            if (ex.Message.Contains("quota exceeded"))
            {
                return StatusCode(429, new { message = "AI quota exceeded for today." });
            }
            return StatusCode(500, new { message = "An error occurred while generating the summary.", details = ex.Message });
        }
    }

    [HttpPost("parse-linkedin")]
    public async Task<IActionResult> ParseLinkedIn([FromBody] AiLinkedInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProfileText))
        {
            return BadRequest("Profile text is required.");
        }

        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _aiService.ParseLinkedInProfileAsync(request.ProfileText, userId);
            return Content(result, "application/json"); 
        }
        catch (System.Exception ex)
        {
            if (ex.Message.Contains("quota exceeded"))
            {
                return StatusCode(429, new { message = "AI quota exceeded for today." });
            }
            return StatusCode(500, new { message = "An error occurred while generating the summary.", details = ex.Message });
        }
    }
}

public class AiCompanyRequest
{
    public string CompanyName { get; set; } = string.Empty;
}

public class AiLinkedInRequest
{
    public string ProfileText { get; set; } = string.Empty;
}

using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SettingsController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        
        if (settings == null)
        {
            settings = new UserSettings { UserId = userId };
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        // Don't send the full API Key back in clear text for security (optional, but good practice). 
        // We will just send a masked version or the full version since this is a local app.
        // Given it's a personal app, sending it is fine so they can see what they entered.
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UserSettings updatedSettings)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        if (settings == null) return NotFound();

        settings.AiApiKey = updatedSettings.AiApiKey;
        settings.Theme = updatedSettings.Theme;
        settings.NotificationsEnabled = updatedSettings.NotificationsEnabled;

        await _context.SaveChangesAsync();

        return Ok(settings);
    }
}

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
public class ProfileController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ProfileController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        
        if (profile == null)
        {
            profile = new UserProfile { UserId = userId };
            _context.UserProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UserProfile updatedProfile)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null) return NotFound();

        profile.FirstName = updatedProfile.FirstName;
        profile.LastName = updatedProfile.LastName;
        profile.JobTitle = updatedProfile.JobTitle;
        profile.ExperienceYears = updatedProfile.ExperienceYears;
        profile.SalaryExpectationMin = updatedProfile.SalaryExpectationMin;
        profile.SalaryExpectationMax = updatedProfile.SalaryExpectationMax;
        profile.RemotePreference = updatedProfile.RemotePreference;
        profile.LinkedInUrl = updatedProfile.LinkedInUrl;
        profile.PortfolioUrl = updatedProfile.PortfolioUrl;
        profile.FreeNotes = updatedProfile.FreeNotes;
        profile.Address = updatedProfile.Address;
        profile.CityCode = updatedProfile.CityCode;
        profile.Latitude = updatedProfile.Latitude;
        profile.Longitude = updatedProfile.Longitude;

        await _context.SaveChangesAsync();

        return Ok(profile);
    }
}

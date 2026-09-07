using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Domain.Entities;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace MyJobBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobAlertsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public JobAlertsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyAlerts()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var alerts = await _context.JobAlerts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var result = alerts.Select(a => new
        {
            a.Id,
            a.Name,
            a.CreatedAt,
            SearchParams = JsonSerializer.Deserialize<object>(a.SearchParamsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAlert([FromBody] CreateJobAlertRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (string.IsNullOrEmpty(request.Name))
            return BadRequest("Le nom de l'alerte est requis.");

        var alert = new JobAlert
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            SearchParamsJson = JsonSerializer.Serialize(request.SearchParams),
            CreatedAt = DateTime.UtcNow
        };

        _context.JobAlerts.Add(alert);
        await _context.SaveChangesAsync();

        return Ok(new { id = alert.Id });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAlert(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var alert = await _context.JobAlerts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (alert == null)
            return NotFound();

        _context.JobAlerts.Remove(alert);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateJobAlertRequest
{
    public string Name { get; set; } = string.Empty;
    public object SearchParams { get; set; } = new object();
}

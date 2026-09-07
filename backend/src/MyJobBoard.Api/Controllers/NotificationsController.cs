using System;
using System.Linq;
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
public class NotificationsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public NotificationsController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var notifications = await _context.UserNotifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedDate)
            .Take(50)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPut("{id}/mark-as-read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var notification = await _context.UserNotifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(notification);
    }

    [HttpPut("mark-all-as-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var unreadNotifications = await _context.UserNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }
}

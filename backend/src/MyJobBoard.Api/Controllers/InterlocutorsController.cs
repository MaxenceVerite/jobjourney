using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Application.DTOs;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InterlocutorsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public InterlocutorsController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InterlocutorDto>>> GetInterlocutors()
    {
        var userId = _currentUserService.UserId;
        var interlocutors = await _context.Interlocutors
            .Where(i => i.UserId == null || i.UserId == userId)
            .Select(i => new InterlocutorDto
            {
                Id = i.Id,
                FirstName = i.FirstName,
                LastName = i.LastName,
                Role = i.Role,
                LinkedinProfile = i.LinkedinProfile,
                Mail = i.Mail,
                Phone = i.Phone,
                CompanyId = i.CompanyId
            })
            .ToListAsync();

        return Ok(interlocutors);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InterlocutorDto>> GetInterlocutor(Guid id)
    {
        var interlocutor = await _context.Interlocutors.FirstOrDefaultAsync(i => i.Id == id);
        if (interlocutor == null)
        {
            return NotFound();
        }

        return Ok(new InterlocutorDto
        {
            Id = interlocutor.Id,
            FirstName = interlocutor.FirstName,
            LastName = interlocutor.LastName,
            Role = interlocutor.Role,
            LinkedinProfile = interlocutor.LinkedinProfile,
            Mail = interlocutor.Mail,
            Phone = interlocutor.Phone,
            CompanyId = interlocutor.CompanyId
        });
    }

    [HttpPost]
    public async Task<ActionResult<InterlocutorDto>> CreateInterlocutor([FromBody] InterlocutorDto dto)
    {
        var userId = _currentUserService.UserId;
        var interlocutor = new Interlocutor
        {
            Id = dto.Id.HasValue && dto.Id != Guid.Empty ? dto.Id.Value : Guid.NewGuid(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = dto.Role,
            LinkedinProfile = dto.LinkedinProfile,
            Mail = dto.Mail,
            Phone = dto.Phone,
            CompanyId = dto.CompanyId,
            UserId = userId
        };

        _context.Interlocutors.Add(interlocutor);
        await _context.SaveChangesAsync();

        dto.Id = interlocutor.Id;
        return CreatedAtAction(nameof(GetInterlocutor), new { id = interlocutor.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<InterlocutorDto>> UpdateInterlocutor(Guid id, [FromBody] InterlocutorDto dto)
    {
        var interlocutor = await _context.Interlocutors.FirstOrDefaultAsync(i => i.Id == id);
        if (interlocutor == null)
        {
            return NotFound();
        }

        interlocutor.FirstName = dto.FirstName;
        interlocutor.LastName = dto.LastName;
        interlocutor.Role = dto.Role;
        interlocutor.LinkedinProfile = dto.LinkedinProfile;
        interlocutor.Mail = dto.Mail;
        interlocutor.Phone = dto.Phone;
        interlocutor.CompanyId = dto.CompanyId;

        await _context.SaveChangesAsync();

        dto.Id = interlocutor.Id;
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteInterlocutor(Guid id)
    {
        var interlocutor = await _context.Interlocutors.FirstOrDefaultAsync(i => i.Id == id);
        if (interlocutor == null)
        {
            return NotFound();
        }

        _context.Interlocutors.Remove(interlocutor);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

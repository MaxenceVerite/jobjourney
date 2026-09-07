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
public class CompaniesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CompaniesController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> GetCompanies()
    {
        var userId = _currentUserService.UserId;
        var companies = await _context.Companies
            .Where(c => c.UserId == null || c.UserId == userId)
            .Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                LinkedinPageUrl = c.LinkedinPageUrl,
                WebsiteUrl = c.WebsiteUrl,
                Siret = c.Siret,
                Address = c.Address,
                EmployeeCount = c.EmployeeCount,
                Industry = c.Industry,
                Pitch = c.Pitch,
                Competitors = c.Competitors,
                Culture = c.Culture,
                InterviewTips = c.InterviewTips
            })
            .ToListAsync();

        return Ok(companies);
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDto>> CreateCompany([FromBody] CompanyDto dto)
    {
        var userId = _currentUserService.UserId;
        var company = new Company
        {
            Id = dto.Id.HasValue && dto.Id != Guid.Empty ? dto.Id.Value : Guid.NewGuid(),
            Name = dto.Name,
            LinkedinPageUrl = dto.LinkedinPageUrl,
            WebsiteUrl = dto.WebsiteUrl,
            Siret = dto.Siret,
            Address = dto.Address,
            EmployeeCount = dto.EmployeeCount,
            Industry = dto.Industry,
            Pitch = dto.Pitch,
            Competitors = dto.Competitors,
            Culture = dto.Culture,
            InterviewTips = dto.InterviewTips,
            UserId = userId
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        dto.Id = company.Id;
        return CreatedAtAction(nameof(GetCompanies), new { id = company.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CompanyDto>> UpdateCompany(Guid id, [FromBody] CompanyDto dto)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == id);
        if (company == null)
        {
            return NotFound();
        }

        company.Name = dto.Name;
        company.LinkedinPageUrl = dto.LinkedinPageUrl;
        company.WebsiteUrl = dto.WebsiteUrl;
        company.Siret = dto.Siret;
        company.Address = dto.Address;
        company.EmployeeCount = dto.EmployeeCount;
        company.Industry = dto.Industry;
        company.Pitch = dto.Pitch;
        company.Competitors = dto.Competitors;
        company.Culture = dto.Culture;
        company.InterviewTips = dto.InterviewTips;

        await _context.SaveChangesAsync();

        dto.Id = company.Id;
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCompany(Guid id)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == id);
        if (company == null)
        {
            return NotFound();
        }

        _context.Companies.Remove(company);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

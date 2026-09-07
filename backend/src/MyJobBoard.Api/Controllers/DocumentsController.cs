using System.Text.Json;
using System.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Application.DTOs;
using MyJobBoard.Domain.Entities;
using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;

    public DocumentsController(
        IApplicationDbContext context,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
    }

    private class FilterCriterion
    {
        public string? Field { get; set; }
        public string? Operator { get; set; }
        public string? Value { get; set; }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> GetDocuments(
        [FromQuery] string? filterCriterias = null,
        [FromQuery] DocumentType? type = null)
    {
        var userId = _currentUserService.UserId;
        var query = _context.Documents.Where(d => d.UserId == null || d.UserId == userId);

        if (type.HasValue)
        {
            query = query.Where(d => d.Type == type.Value);
        }

        if (!string.IsNullOrWhiteSpace(filterCriterias))
        {
            try
            {
                var decodedJson = HttpUtility.UrlDecode(filterCriterias);
                var criteria = JsonSerializer.Deserialize<List<FilterCriterion>>(decodedJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (criteria != null)
                {
                    foreach (var criterion in criteria)
                    {
                        if (string.Equals(criterion.Field, "type", StringComparison.OrdinalIgnoreCase) &&
                            Enum.TryParse<DocumentType>(criterion.Value, true, out var docType))
                        {
                            query = query.Where(d => d.Type == docType);
                        }
                    }
                }
            }
            catch
            {
                // In case filter criteria JSON parsing fails, continue without filter
            }
        }

        var documents = await query
            .OrderByDescending(d => d.UploadedDate)
            .Select(d => new DocumentDto
            {
                Id = d.Id,
                Type = d.Type,
                Path = d.Path,
                Name = d.Name,
                UploadedDate = d.UploadedDate
            })
            .ToListAsync();

        return Ok(documents);
    }

    [HttpPost("upload")]
    public async Task<ActionResult<DocumentUploadResponseDto>> UploadDocument(
        [FromForm] IFormFile file,
        [FromForm] string documentType,
        [FromForm] string? customName = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "Fichier manquant ou vide." });
        }

        if (!Enum.TryParse<DocumentType>(documentType, true, out var parsedType))
        {
            parsedType = DocumentType.CV;
        }

        var fileName = !string.IsNullOrWhiteSpace(customName) ? customName : file.FileName;
        var userId = _currentUserService.UserId;

        using var stream = file.OpenReadStream();
        var storedPath = await _fileStorageService.SaveFileAsync(stream, file.FileName);

        var document = new Document
        {
            Id = Guid.NewGuid(),
            Type = parsedType,
            Path = storedPath,
            Name = fileName,
            UploadedDate = DateTime.UtcNow,
            UserId = userId
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        return Ok(new DocumentUploadResponseDto
        {
            DocumentId = document.Id.ToString()
        });
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadDocument(Guid id)
    {
        var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
        if (document == null)
        {
            return NotFound();
        }

        var fileResult = await _fileStorageService.GetFileAsync(document.Path);
        if (fileResult == null)
        {
            return NotFound(new { error = "Fichier physique introuvable." });
        }

        return File(fileResult.Value.Stream, fileResult.Value.ContentType, document.Name);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DocumentDto>> UpdateDocument(Guid id, [FromBody] DocumentDto dto)
    {
        var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
        if (document == null)
        {
            return NotFound();
        }

        document.Name = dto.Name;
        document.Type = dto.Type;

        await _context.SaveChangesAsync();

        dto.Id = document.Id;
        dto.Path = document.Path;
        dto.UploadedDate = document.UploadedDate;
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
        if (document == null)
        {
            return NotFound();
        }

        await _fileStorageService.DeleteFileAsync(document.Path);
        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();

        return Ok(new { id = id.ToString() });
    }
}

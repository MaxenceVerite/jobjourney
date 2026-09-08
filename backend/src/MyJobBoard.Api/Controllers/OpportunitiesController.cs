using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Application.DTOs;
using MyJobBoard.Domain.Common;
using MyJobBoard.Domain.Entities;
using MyJobBoard.Domain.Enums;
using System.Text.Json;

namespace MyJobBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OpportunitiesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAiService _aiService;

    public OpportunitiesController(IApplicationDbContext context, ICurrentUserService currentUserService, IAiService aiService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _aiService = aiService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OpportunityDto>>> GetOpportunities()
    {
        var userId = _currentUserService.UserId;
        var opportunities = await _context.Opportunities
            .Where(o => o.UserId == null || o.UserId == userId)
            .Include(o => o.RelatedApplication)
            .Include(o => o.Interviews)
                .ThenInclude(i => i.Interviewers)
            .Include(o => o.Offers)
            .Include(o => o.Documents)
            .ToListAsync();

        return Ok(opportunities.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OpportunityDto>> GetOpportunity(Guid id)
    {
        var opportunity = await _context.Opportunities
            .Include(o => o.RelatedApplication)
            .Include(o => o.Interviews)
                .ThenInclude(i => i.Interviewers)
            .Include(o => o.Offers)
            .Include(o => o.Documents)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (opportunity == null)
        {
            return NotFound();
        }

        return Ok(MapToDto(opportunity));
    }

    [HttpPost]
    public async Task<ActionResult<OpportunityDto>> CreateOpportunity([FromBody] OpportunityDto dto)
    {
        var userId = _currentUserService.UserId;
        var opportunity = new Opportunity
        {
            Id = dto.Id.HasValue && dto.Id != Guid.Empty ? dto.Id.Value : Guid.NewGuid(),
            RoleTitle = dto.RoleTitle,
            Industry = dto.Industry,
            RemoteCondition = dto.RemoteCondition,
            Location = dto.Location,
            CompanyId = dto.CompanyId,
            StartDate = dto.StartDate != default ? dto.StartDate : DateTime.UtcNow,
            LastUpdateDate = DateTime.UtcNow,
            State = dto.State,
            FreeNotes = dto.FreeNotes,
            UserAppreciationLevel = dto.UserAppreciationLevel,
            ConfidenceLevel = dto.ConfidenceLevel,
            ArchiveReason = dto.ArchiveReason,
            ArchiveFeedback = dto.ArchiveFeedback,
            ArchivedDate = dto.ArchivedDate,
            UserId = userId,
            SalaryRangeMin = dto.IndicativeSalaryRange?.Min,
            SalaryRangeMax = dto.IndicativeSalaryRange?.Max,
            SalaryRangePeriodicity = dto.IndicativeSalaryRange?.Periodicity
        };

        if (dto.RelatedApplication != null)
        {
            opportunity.RelatedApplication = new MyJobBoard.Domain.Entities.Application
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunity.Id,
                Type = dto.RelatedApplication.Type,
                CustomType = dto.RelatedApplication.CustomType,
                ExpectedExperienceYearsMin = dto.RelatedApplication.ExpectedExperienceInYears?.Min,
                ExpectedExperienceYearsMax = dto.RelatedApplication.ExpectedExperienceInYears?.Max,
                OfferBudgetMin = dto.RelatedApplication.OfferBudget?.Min,
                OfferBudgetMax = dto.RelatedApplication.OfferBudget?.Max,
                OfferBudgetPeriodicity = dto.RelatedApplication.OfferBudget?.Periodicity,
                LinkToJobOffer = dto.RelatedApplication.LinkToJobOffer,
                JobOfferDetails = dto.RelatedApplication.JobOfferDetails,
                FreeNotes = dto.RelatedApplication.FreeNotes
            };
        }

        if (dto.Interviews != null)
        {
            foreach (var interviewDto in dto.Interviews)
            {
                var interview = new Interview
                {
                    Id = interviewDto.Id.HasValue && interviewDto.Id != Guid.Empty ? interviewDto.Id.Value : Guid.NewGuid(),
                    OpportunityId = opportunity.Id,
                    Type = interviewDto.Type,
                    CustomType = interviewDto.CustomType,
                    DueDate = interviewDto.DueDate,
                    MeetingCondition = interviewDto.MeetingCondition,
                    FreeNotes = interviewDto.FreeNotes
                };

                if (interviewDto.Interviewers != null)
                {
                    foreach (var interviewer in interviewDto.Interviewers)
                    {
                        interview.Interviewers.Add(new OpportunityInterviewInterlocutor
                        {
                            InterviewId = interview.Id,
                            InterlocutorId = interviewer.Id
                        });
                    }
                }

                opportunity.Interviews.Add(interview);
            }
        }

        if (dto.Offers != null)
        {
            foreach (var offerDto in dto.Offers)
            {
                opportunity.Offers.Add(new Offer
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunity.Id,
                    IsCounterOffer = offerDto.IsCounterOffer,
                    GrossYearlySalary = offerDto.GrossYearlySalary,
                    FreeNotes = offerDto.FreeNotes
                });
            }
        }

        if (dto.Documents != null)
        {
            foreach (var docDto in dto.Documents)
            {
                opportunity.Documents.Add(new OpportunityDocument
                {
                    OpportunityId = opportunity.Id,
                    DocumentId = docDto.Id
                });
            }
        }

        _context.Opportunities.Add(opportunity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOpportunity), new { id = opportunity.Id }, MapToDto(opportunity));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<OpportunityDto>> UpdateOpportunity(Guid id, [FromBody] OpportunityDto dto)
    {
        var opportunity = await _context.Opportunities
            .Include(o => o.RelatedApplication)
            .Include(o => o.Interviews)
            .Include(o => o.Offers)
            .Include(o => o.Documents)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (opportunity == null)
        {
            return NotFound();
        }

        opportunity.RoleTitle = dto.RoleTitle;
        opportunity.Industry = dto.Industry;
        opportunity.RemoteCondition = dto.RemoteCondition;
        opportunity.Location = dto.Location;
        opportunity.CompanyId = dto.CompanyId;
        opportunity.StartDate = dto.StartDate != default ? dto.StartDate : opportunity.StartDate;
        opportunity.LastUpdateDate = DateTime.UtcNow;
        opportunity.State = dto.State;
        opportunity.FreeNotes = dto.FreeNotes;
        opportunity.UserAppreciationLevel = dto.UserAppreciationLevel;
        opportunity.ConfidenceLevel = dto.ConfidenceLevel;
        opportunity.ArchiveReason = dto.ArchiveReason;
        opportunity.ArchiveFeedback = dto.ArchiveFeedback;
        opportunity.ArchivedDate = dto.ArchivedDate;

        opportunity.SalaryRangeMin = dto.IndicativeSalaryRange?.Min;
        opportunity.SalaryRangeMax = dto.IndicativeSalaryRange?.Max;
        opportunity.SalaryRangePeriodicity = dto.IndicativeSalaryRange?.Periodicity;

        if (dto.RelatedApplication != null)
        {
            if (opportunity.RelatedApplication == null)
            {
                opportunity.RelatedApplication = new MyJobBoard.Domain.Entities.Application
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunity.Id
                };
            }
            opportunity.RelatedApplication.Type = dto.RelatedApplication.Type;
            opportunity.RelatedApplication.CustomType = dto.RelatedApplication.CustomType;
            opportunity.RelatedApplication.ExpectedExperienceYearsMin = dto.RelatedApplication.ExpectedExperienceInYears?.Min;
            opportunity.RelatedApplication.ExpectedExperienceYearsMax = dto.RelatedApplication.ExpectedExperienceInYears?.Max;
            opportunity.RelatedApplication.OfferBudgetMin = dto.RelatedApplication.OfferBudget?.Min;
            opportunity.RelatedApplication.OfferBudgetMax = dto.RelatedApplication.OfferBudget?.Max;
            opportunity.RelatedApplication.OfferBudgetPeriodicity = dto.RelatedApplication.OfferBudget?.Periodicity;
            opportunity.RelatedApplication.LinkToJobOffer = dto.RelatedApplication.LinkToJobOffer;
            opportunity.RelatedApplication.JobOfferDetails = dto.RelatedApplication.JobOfferDetails;
            opportunity.RelatedApplication.FreeNotes = dto.RelatedApplication.FreeNotes;
        }

        await _context.SaveChangesAsync();

        return Ok(MapToDto(opportunity));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOpportunity(Guid id)
    {
        var opportunity = await _context.Opportunities.FirstOrDefaultAsync(o => o.Id == id);
        if (opportunity == null)
        {
            return NotFound();
        }

        _context.Opportunities.Remove(opportunity);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Sub-resource: Interviews
    [HttpPost("{opportunityId:guid}/interviews")]
    public async Task<ActionResult<InterviewDto>> CreateInterview(Guid opportunityId, [FromBody] InterviewDto dto)
    {
        var opportunity = await _context.Opportunities.FirstOrDefaultAsync(o => o.Id == opportunityId);
        if (opportunity == null)
        {
            return NotFound();
        }

        var interview = new Interview
        {
            Id = dto.Id.HasValue && dto.Id != Guid.Empty ? dto.Id.Value : Guid.NewGuid(),
            OpportunityId = opportunityId,
            Type = dto.Type,
            CustomType = dto.CustomType,
            DueDate = dto.DueDate,
            MeetingCondition = dto.MeetingCondition,
            FreeNotes = dto.FreeNotes
        };

        if (dto.Interviewers != null)
        {
            foreach (var interviewer in dto.Interviewers)
            {
                interview.Interviewers.Add(new OpportunityInterviewInterlocutor
                {
                    InterviewId = interview.Id,
                    InterlocutorId = interviewer.Id
                });
            }
        }

        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

        dto.Id = interview.Id;
        return Ok(dto);
    }

    [HttpPut("{opportunityId:guid}/interviews/{interviewId:guid}")]
    public async Task<ActionResult<InterviewDto>> UpdateInterview(Guid opportunityId, Guid interviewId, [FromBody] InterviewDto dto)
    {
        var interview = await _context.Interviews
            .Include(i => i.Interviewers)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.OpportunityId == opportunityId);

        if (interview == null)
        {
            return NotFound();
        }

        interview.Type = dto.Type;
        interview.CustomType = dto.CustomType;
        interview.DueDate = dto.DueDate;
        interview.MeetingCondition = dto.MeetingCondition;
        interview.FreeNotes = dto.FreeNotes;

        await _context.SaveChangesAsync();

        dto.Id = interview.Id;
        return Ok(dto);
    }

    [HttpDelete("{opportunityId:guid}/interviews/{interviewId:guid}")]
    public async Task<IActionResult> DeleteInterview(Guid opportunityId, Guid interviewId)
    {
        var interview = await _context.Interviews.FirstOrDefaultAsync(i => i.Id == interviewId && i.OpportunityId == opportunityId);
        if (interview == null)
        {
            return NotFound();
        }

        _context.Interviews.Remove(interview);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // AI Summary generation
    [HttpPost("{id:guid}/generate-summary")]
    public async Task<IActionResult> GenerateSummary(Guid id)
    {
        var userId = _currentUserService.UserId;

        var opportunity = await _context.Opportunities
            .Include(o => o.RelatedApplication)
            .Include(o => o.Interviews).ThenInclude(i => i.Interviewers).ThenInclude(ii => ii.Interlocutor)
            .Include(o => o.Offers)
            .Include(o => o.Documents).ThenInclude(d => d.Document)
            .Include(o => o.Company)
            .FirstOrDefaultAsync(o => o.Id == id && (o.UserId == null || o.UserId == userId));

        if (opportunity == null) return NotFound();

        // Build a compact context object for the AI
        var context = new
        {
            etape = opportunity.State.ToString(),
            poste = opportunity.RoleTitle,
            localisation = opportunity.Location,
            teletravail = opportunity.RemoteCondition?.ToString(),
            salaireIndicatif = opportunity.SalaryRangeMin.HasValue
                ? $"{opportunity.SalaryRangeMin}–{opportunity.SalaryRangeMax} {opportunity.SalaryRangePeriodicity}"
                : null,
            notesGenerales = opportunity.FreeNotes,
            entreprise = opportunity.Company != null ? new
            {
                nom = opportunity.Company.Name,
                secteur = opportunity.Company.Industry,
                pitch = opportunity.Company.Pitch,
                culture = opportunity.Company.Culture,
                effectif = opportunity.Company.EmployeeCount
            } : null,
            offre = opportunity.RelatedApplication != null ? new
            {
                type = opportunity.RelatedApplication.Type.ToString(),
                lienOffre = opportunity.RelatedApplication.LinkToJobOffer,
                descriptionOffre = opportunity.RelatedApplication.JobOfferDetails,
                notesCandidat = opportunity.RelatedApplication.FreeNotes,
                experienceRequise = opportunity.RelatedApplication.ExpectedExperienceYearsMin.HasValue
                    ? $"{opportunity.RelatedApplication.ExpectedExperienceYearsMin}–{opportunity.RelatedApplication.ExpectedExperienceYearsMax} ans"
                    : null,
                budgetOffre = opportunity.RelatedApplication.OfferBudgetMin.HasValue
                    ? $"{opportunity.RelatedApplication.OfferBudgetMin}–{opportunity.RelatedApplication.OfferBudgetMax}"
                    : null
            } : null,
            entretiens = opportunity.Interviews.Select(i => new
            {
                type = i.Type.ToString(),
                date = i.DueDate.ToString("dd/MM/yyyy"),
                notes = i.FreeNotes,
                interlocuteurs = i.Interviewers.Select(ii => new
                {
                    nom = $"{ii.Interlocutor?.FirstName} {ii.Interlocutor?.LastName}",
                    role = ii.Interlocutor?.Role
                })
            }),
            documents = opportunity.Documents.Select(d => new
            {
                nom = d.Document?.Name,
                type = d.Document?.Type.ToString()
            })
        };

        var jsonContext = JsonSerializer.Serialize(context, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false
        });

        try
        {
            var summary = await _aiService.GenerateOpportunitySummaryAsync(jsonContext, userId!);

            // Persist the summary on the opportunity
            opportunity.AiSummary = summary;
            await _context.SaveChangesAsync();

            return Ok(new { summary });
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("quota exceeded"))
                return StatusCode(429, new { message = "Quota IA dépassé pour aujourd'hui." });
            return StatusCode(500, new { message = "Erreur lors de la génération du résumé.", details = ex.Message });
        }
    }

    // Documents association
    [HttpPut("{opportunityId:guid}/documents")]
    public async Task<IActionResult> UpdateOpportunityDocuments(Guid opportunityId, [FromBody] List<string> documentIds)
    {
        var opportunity = await _context.Opportunities
            .Include(o => o.Documents)
            .FirstOrDefaultAsync(o => o.Id == opportunityId);

        if (opportunity == null)
        {
            return NotFound();
        }

        opportunity.Documents.Clear();
        foreach (var docIdStr in documentIds)
        {
            if (Guid.TryParse(docIdStr, out var docId))
            {
                opportunity.Documents.Add(new OpportunityDocument
                {
                    OpportunityId = opportunityId,
                    DocumentId = docId
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Interview interlocutors association
    [HttpPut("{opportunityId:guid}/interviews/{interviewId:guid}/interlocutors")]
    public async Task<IActionResult> UpdateInterviewInterlocutors(Guid opportunityId, Guid interviewId, [FromBody] List<string> interlocutorIds)
    {
        var interview = await _context.Interviews
            .Include(i => i.Interviewers)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.OpportunityId == opportunityId);

        if (interview == null)
        {
            return NotFound();
        }

        interview.Interviewers.Clear();
        foreach (var idStr in interlocutorIds)
        {
            if (Guid.TryParse(idStr, out var interlocutorId))
            {
                interview.Interviewers.Add(new OpportunityInterviewInterlocutor
                {
                    InterviewId = interviewId,
                    InterlocutorId = interlocutorId
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private static OpportunityDto MapToDto(Opportunity o)
    {
        return new OpportunityDto
        {
            Id = o.Id,
            RoleTitle = o.RoleTitle,
            Industry = o.Industry,
            RemoteCondition = o.RemoteCondition,
            Location = o.Location,
            CompanyId = o.CompanyId,
            StartDate = o.StartDate,
            LastUpdateDate = o.LastUpdateDate,
            State = o.State,
            FreeNotes = o.FreeNotes,
            UserAppreciationLevel = o.UserAppreciationLevel,
            ConfidenceLevel = o.ConfidenceLevel,
            ArchiveReason = o.ArchiveReason,
            ArchiveFeedback = o.ArchiveFeedback,
            ArchivedDate = o.ArchivedDate,
            IndicativeSalaryRange = o.SalaryRangeMin.HasValue ? new SalaryRange
            {
                Min = o.SalaryRangeMin.Value,
                Max = o.SalaryRangeMax,
                Periodicity = o.SalaryRangePeriodicity ?? Periodicity.Yearly
            } : null,
            RelatedApplication = o.RelatedApplication != null ? new ApplicationDto
            {
                Type = o.RelatedApplication.Type,
                CustomType = o.RelatedApplication.CustomType,
                ExpectedExperienceInYears = o.RelatedApplication.ExpectedExperienceYearsMin.HasValue ? new RangeValue
                {
                    Min = o.RelatedApplication.ExpectedExperienceYearsMin.Value,
                    Max = o.RelatedApplication.ExpectedExperienceYearsMax
                } : null,
                OfferBudget = o.RelatedApplication.OfferBudgetMin.HasValue ? new SalaryRange
                {
                    Min = o.RelatedApplication.OfferBudgetMin.Value,
                    Max = o.RelatedApplication.OfferBudgetMax,
                    Periodicity = o.RelatedApplication.OfferBudgetPeriodicity ?? Periodicity.Yearly
                } : null,
                LinkToJobOffer = o.RelatedApplication.LinkToJobOffer,
                JobOfferDetails = o.RelatedApplication.JobOfferDetails,
                FreeNotes = o.RelatedApplication.FreeNotes
            } : null,
            Interviews = o.Interviews.Select(i => new InterviewDto
            {
                Id = i.Id,
                Type = i.Type,
                CustomType = i.CustomType,
                DueDate = i.DueDate,
                MeetingCondition = i.MeetingCondition,
                FreeNotes = i.FreeNotes,
                Interviewers = i.Interviewers.Select(inv => new OpportunityInterviewInterlocutorDto { Id = inv.InterlocutorId }).ToList()
            }).ToList(),
            Offers = o.Offers.Select(off => new OfferDto
            {
                IsCounterOffer = off.IsCounterOffer,
                GrossYearlySalary = off.GrossYearlySalary,
                FreeNotes = off.FreeNotes
            }).ToList(),
            Documents = o.Documents.Select(d => new OpportunityDocumentDto
            {
                Id = d.DocumentId
            }).ToList(),
            AiSummary = o.AiSummary
        };
    }
}

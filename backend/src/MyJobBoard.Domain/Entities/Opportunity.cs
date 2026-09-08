using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Domain.Entities;

public class Opportunity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RoleTitle { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public RemoteCondition? RemoteCondition { get; set; }
    public string? Location { get; set; }
    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime LastUpdateDate { get; set; } = DateTime.UtcNow;
    public DateTime? LastFollowUpDate { get; set; }
    public EOpportunityState State { get; set; } = EOpportunityState.DRAFT;
    public string? FreeNotes { get; set; }
    public string? AiSummary { get; set; }
    public int? UserAppreciationLevel { get; set; }
    public int? ConfidenceLevel { get; set; }
    public string? UserId { get; set; }

    // Archive fields
    public string? ArchiveReason { get; set; }
    public string? ArchiveFeedback { get; set; }
    public DateTime? ArchivedDate { get; set; }

    // Salary Range fields
    public double? SalaryRangeMin { get; set; }
    public double? SalaryRangeMax { get; set; }
    public Periodicity? SalaryRangePeriodicity { get; set; }

    // Navigation properties
    public Application? RelatedApplication { get; set; }
    public ICollection<Interview> Interviews { get; set; } = new List<Interview>();
    public ICollection<Offer> Offers { get; set; } = new List<Offer>();
    public ICollection<OpportunityDocument> Documents { get; set; } = new List<OpportunityDocument>();
}

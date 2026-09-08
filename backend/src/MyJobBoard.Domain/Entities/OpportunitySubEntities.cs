using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Domain.Entities;

public class Interview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }
    public InterviewType Type { get; set; }
    public string? CustomType { get; set; }
    public DateTime DueDate { get; set; }
    public MeetingConditions MeetingCondition { get; set; }
    public string? FreeNotes { get; set; }

    public ICollection<OpportunityInterviewInterlocutor> Interviewers { get; set; } = new List<OpportunityInterviewInterlocutor>();
}

public class Application
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }
    public ApplicationType Type { get; set; }
    public string? CustomType { get; set; }
    public double? ExpectedExperienceYearsMin { get; set; }
    public double? ExpectedExperienceYearsMax { get; set; }
    public double? OfferBudgetMin { get; set; }
    public double? OfferBudgetMax { get; set; }
    public Periodicity? OfferBudgetPeriodicity { get; set; }
    public string? LinkToJobOffer { get; set; }
    public string? JobOfferDetails { get; set; }
    public string? FreeNotes { get; set; }
}

public class Offer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }
    public bool IsCounterOffer { get; set; }
    public double GrossYearlySalary { get; set; }
    public string? FreeNotes { get; set; }
}

public class OpportunityDocument
{
    public Guid OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }
    public Guid DocumentId { get; set; }
    public Document? Document { get; set; }
}

public class OpportunityInterviewInterlocutor
{
    public Guid InterviewId { get; set; }
    public Interview? Interview { get; set; }
    public Guid InterlocutorId { get; set; }
    public Interlocutor? Interlocutor { get; set; }
}

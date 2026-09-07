namespace MyJobBoard.Domain.Entities;

public class Company
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? LinkedinPageUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? UserId { get; set; }
    
    // Gov API Facts
    public string? Siret { get; set; }
    public string? Address { get; set; }
    public string? EmployeeCount { get; set; }
    public string? Industry { get; set; }

    // AI Enrichment
    public string? Pitch { get; set; }
    public string? Competitors { get; set; }
    public string? Culture { get; set; }
    public string? InterviewTips { get; set; }

    public ICollection<Interlocutor> Interlocutors { get; set; } = new List<Interlocutor>();
    public ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();
}

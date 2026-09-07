namespace MyJobBoard.Domain.Entities;

public class Interlocutor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? LinkedinProfile { get; set; }
    public string? Mail { get; set; }
    public string? Phone { get; set; }
    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }
    public string? UserId { get; set; }

    public ICollection<OpportunityInterviewInterlocutor> InterviewInterlocutors { get; set; } = new List<OpportunityInterviewInterlocutor>();
}

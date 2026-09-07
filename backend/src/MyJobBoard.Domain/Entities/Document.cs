using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Domain.Entities;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DocumentType Type { get; set; }
    public string Path { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime UploadedDate { get; set; } = DateTime.UtcNow;
    public string? UserId { get; set; }

    public ICollection<OpportunityDocument> OpportunityDocuments { get; set; } = new List<OpportunityDocument>();
}

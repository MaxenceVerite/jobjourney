using System;

namespace MyJobBoard.Domain.Entities;

public class UserNotification
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // e.g., "Reminder", "Tip", "System"
    public string? LinkUrl { get; set; }
    public Guid? RelatedEntityId { get; set; } // E.g., OpportunityId
    public bool IsRead { get; set; }
    public DateTime CreatedDate { get; set; }
}

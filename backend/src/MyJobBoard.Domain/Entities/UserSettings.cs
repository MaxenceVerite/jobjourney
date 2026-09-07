using System;

namespace MyJobBoard.Domain.Entities;

public class UserSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    
    public string? AiApiKey { get; set; }
    
    public string? Theme { get; set; } = "light";
    public bool NotificationsEnabled { get; set; } = true;
}

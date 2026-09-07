using System;

namespace MyJobBoard.Domain.Entities;

public class AiUsage
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int RequestsCount { get; set; }
}

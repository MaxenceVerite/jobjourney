using System;

namespace MyJobBoard.Domain.Entities;

public class AiCompanySummaryCache
{
    public Guid Id { get; set; }
    public string NormalizedCompanyName { get; set; } = string.Empty;
    public string SummaryJson { get; set; } = string.Empty;
    public DateTime LastUpdatedAt { get; set; }
}

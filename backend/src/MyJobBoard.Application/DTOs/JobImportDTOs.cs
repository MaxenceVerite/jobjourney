using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Application.DTOs;

public class JobImportRequestDto
{
    public string? Url { get; set; }
    public string? Text { get; set; }
    public bool UseAiEnrichment { get; set; } = false;
}

public class JobImportResultDto
{
    public string RoleTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Industry { get; set; }
    public RemoteCondition? RemoteCondition { get; set; }
    public ApplicationType? ApplicationType { get; set; }
    public string? CustomApplicationType { get; set; }
    public double? SalaryMin { get; set; }
    public double? SalaryMax { get; set; }
    public Periodicity? SalaryPeriodicity { get; set; }
    public string? Description { get; set; }
    public string? SourceUrl { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public List<string> KeySkills { get; set; } = new();

    // Diagnostics / Extraction telemetry
    public bool Success { get; set; }
    public string ExtractionMethod { get; set; } = "None"; // "JSON-LD", "OpenGraph", "Regex", "AI", "ProtectedDomainFallback"
    public bool IsProtectedDomain { get; set; }
    public string? ProtectedDomainName { get; set; } // "linkedin", "indeed"
    public string? Message { get; set; }
}

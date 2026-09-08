using System.Text.Json.Serialization;
using MyJobBoard.Domain.Common;
using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Application.DTOs;

public class RegisterRequestDto
{
    public string? Email { get; set; }
    public string? Mail { get; set; } // Support both email and mail
    public string Password { get; set; } = string.Empty;
    public string? Tel { get; set; }

    public string GetEffectiveEmail() => !string.IsNullOrEmpty(Email) ? Email : Mail ?? string.Empty;
}

public class LoginRequestDto
{
    public string? Email { get; set; }
    public string? Mail { get; set; }
    public string Password { get; set; } = string.Empty;

    public string GetEffectiveEmail() => !string.IsNullOrEmpty(Email) ? Email : Mail ?? string.Empty;
}

public class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class TokenResponseDto
{
    public string TokenType { get; set; } = "Bearer";
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; } = 86400; // 24 hours
    public string RefreshToken { get; set; } = string.Empty;
}

public class CompanyDto
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LinkedinPageUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    
    // Gov API
    public string? Siret { get; set; }
    public string? Address { get; set; }
    public string? EmployeeCount { get; set; }
    public string? Industry { get; set; }

    // AI Enrichment
    public string? Pitch { get; set; }
    public string? Competitors { get; set; }
    public string? Culture { get; set; }
    public string? InterviewTips { get; set; }
}

public class InterlocutorDto
{
    public Guid? Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? LinkedinProfile { get; set; }
    public string? Mail { get; set; }
    public string? Phone { get; set; }
    public Guid? CompanyId { get; set; }
}

public class DocumentDto
{
    public Guid Id { get; set; }
    public DocumentType Type { get; set; }
    public string Path { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime UploadedDate { get; set; }
}

public class DocumentUploadResponseDto
{
    public string DocumentId { get; set; } = string.Empty;
}

public class OpportunityDocumentDto
{
    public Guid Id { get; set; }
}

public class OpportunityInterviewInterlocutorDto
{
    public Guid Id { get; set; }
}

public class InterviewDto
{
    public Guid? Id { get; set; }
    public ICollection<OpportunityInterviewInterlocutorDto> Interviewers { get; set; } = new List<OpportunityInterviewInterlocutorDto>();
    public InterviewType Type { get; set; }
    public string? CustomType { get; set; }
    public DateTime DueDate { get; set; }
    public MeetingConditions MeetingCondition { get; set; }
    public string? FreeNotes { get; set; }
}

public class ApplicationDto
{
    public ApplicationType Type { get; set; }
    public string? CustomType { get; set; }
    public RangeValue? ExpectedExperienceInYears { get; set; }
    public SalaryRange? OfferBudget { get; set; }
    public string? LinkToJobOffer { get; set; }
    public string? JobOfferDetails { get; set; }
    public string? FreeNotes { get; set; }
}

public class OfferDto
{
    public bool IsCounterOffer { get; set; }
    public double GrossYearlySalary { get; set; }
    public string? FreeNotes { get; set; }
}

public class OpportunityDto
{
    public Guid? Id { get; set; }
    public string RoleTitle { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public RemoteCondition? RemoteCondition { get; set; }
    public string? Location { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime LastUpdateDate { get; set; }
    public DateTime? LastFollowUpDate { get; set; }
    public EOpportunityState State { get; set; }
    public string? FreeNotes { get; set; }
    public int? UserAppreciationLevel { get; set; }
    public int? ConfidenceLevel { get; set; }
    public string? ArchiveReason { get; set; }
    public string? ArchiveFeedback { get; set; }
    public DateTime? ArchivedDate { get; set; }

    public SalaryRange? IndicativeSalaryRange { get; set; }
    public ApplicationDto? RelatedApplication { get; set; }
    public ICollection<InterviewDto>? Interviews { get; set; }
    public ICollection<OfferDto>? Offers { get; set; }
    public ICollection<OpportunityDocumentDto>? Documents { get; set; }
    public string? AiSummary { get; set; }
}

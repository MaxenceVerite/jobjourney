using System;
using System.Collections.Generic;
using MyJobBoard.Application.Common.Models.FranceTravail;

namespace MyJobBoard.Application.Common.Models.Matching;

public class SmartMatchSearchRequest
{
    public string? Keyword { get; set; }
    public int? Rayon { get; set; }
    public string? CityCode { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IncludeAiVerdict { get; set; } = true;
    public int Limit { get; set; } = 15;
}

public class SmartMatchSearchResponse
{
    public List<SmartMatchOfferDto> Matches { get; set; } = new();
    public int TotalAnalyzed { get; set; }
    public int TotalRetained { get; set; }
    public string CandidateSummaryUsed { get; set; } = string.Empty;
}

public class SmartMatchOfferDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogoUrl { get; set; }
    public string? Location { get; set; }
    public double? DistanceKm { get; set; }
    public string? ContractType { get; set; }
    public string? SalaryText { get; set; }
    public string? Description { get; set; }
    public string? ExternalUrl { get; set; }
    public DateTime? PublishedAt { get; set; }

    // Fit & Psychological Scores (0 to 100)
    public int GlobalFitScore { get; set; }
    public int TechFitScore { get; set; }
    public int AmbitionFitScore { get; set; }
    public int ConditionsFitScore { get; set; }

    // Trade-off / Concession detection
    public bool HasSignificantTradeOff { get; set; }
    public string MatchCategory { get; set; } = "StandardMatch"; // "PerfectMatch", "TradeOffOpportunity", "CareerAccelerator"
    public List<string> StrongPoints { get; set; } = new();
    public List<string> FrictionPoints { get; set; } = new();

    // AI Coaching & Pitch
    public string? AiCoachVerdict { get; set; }
    public string? TailoredPitch { get; set; }

    // Source reference
    public FranceTravailJobOffer? OriginalOffer { get; set; }
}


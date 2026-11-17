using System;
using System.Collections.Generic;

namespace MyJobBoard.Domain.Entities;

public class UserProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? JobTitle { get; set; }
    
    public double? ExperienceYears { get; set; }
    public double? SalaryExpectationMin { get; set; }
    public double? SalaryExpectationMax { get; set; }
    public string? RemotePreference { get; set; } // e.g. "Remote", "Hybrid", "On-site"
    
    public string? LinkedInUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    
    public string? FreeNotes { get; set; }
    
    public string? Address { get; set; }
    public string? CityCode { get; set; } // Code INSEE
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Ambition & Career DNA
    public string? TargetHorizonRole { get; set; }
    public string? CompactCareerManifesto { get; set; }

    // Value Prioritization Sliders (1 to 5)
    public int WeightSalary { get; set; } = 3;
    public int WeightTechChallenge { get; set; } = 4;
    public int WeightWorkLifeBalance { get; set; } = 4;
    public int WeightCareerGrowth { get; set; } = 3;

    // Compensatory Serendipity Mode
    public bool EnableTradeOffAlerts { get; set; } = true;

    // Skills & Vetos
    public List<string> CoreSkills { get; set; } = new();
    public List<string> DesiredSkills { get; set; } = new();
    public List<string> VetoKeywords { get; set; } = new();
}

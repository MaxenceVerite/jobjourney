using System;

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
}

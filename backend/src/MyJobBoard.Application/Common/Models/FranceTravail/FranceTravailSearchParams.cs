namespace MyJobBoard.Application.Common.Models.FranceTravail;

public class FranceTravailSearchParams
{
    public string? Keyword { get; set; }
    public string? Commune { get; set; }
    public int? Rayon { get; set; } // en km
    public string? TypeContrat { get; set; } // CDI, CDD, etc.
    public string? Experience { get; set; } // 1, 2, 3
    
    public int? PublishDate { get; set; } // En jours (ex: 1, 3, 7, 31)
    public string? RemoteMode { get; set; } // "true" ou "false" / enum
    public string? EducationLevel { get; set; }
    public int Page { get; set; } = 1;
    public int RangeStart => (Page - 1) * 15;
    public int RangeEnd => RangeStart + 14;
    
    public string UserId { get; set; } = string.Empty;
}

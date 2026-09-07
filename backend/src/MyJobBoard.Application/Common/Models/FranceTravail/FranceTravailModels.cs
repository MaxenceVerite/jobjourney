using System;
using System.Collections.Generic;

namespace MyJobBoard.Application.Common.Models.FranceTravail;

public class FranceTravailSearchResponse
{
    public List<FranceTravailJobOffer> Resultats { get; set; } = new();
}

public class FranceTravailJobOffer
{
    public string Id { get; set; } = string.Empty;
    public string Intitule { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? DateCreation { get; set; }
    public DateTime? DateActualisation { get; set; }
    
    public FranceTravailLieuTravail? LieuTravail { get; set; }
    public FranceTravailEntreprise? Entreprise { get; set; }
    public FranceTravailSalaire? Salaire { get; set; }
    public FranceTravailOrigineOffre? OrigineOffre { get; set; }

    public string? TypeContrat { get; set; }
    public string? TypeContratLibelle { get; set; }
    public string? NatureContrat { get; set; }
    
    public string? ExperienceExige { get; set; }
    public string? ExperienceLibelle { get; set; }
}

public class FranceTravailLieuTravail
{
    public string? Libelle { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Commune { get; set; }
}

public class FranceTravailEntreprise
{
    public string? Nom { get; set; }
    public string? Description { get; set; }
    public string? Logo { get; set; }
    public bool? EntrepriseAdaptee { get; set; }
}

public class FranceTravailSalaire
{
    public string? Libelle { get; set; }
    public string? Commentaire { get; set; }
}

public class FranceTravailOrigineOffre
{
    public string? Origine { get; set; }
    public string? UrlOrigine { get; set; }
}

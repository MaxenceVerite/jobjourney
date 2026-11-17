import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, Button, Grid, Card, CardContent, CircularProgress, Chip, 
  MenuItem, FormControl, InputLabel, Select, Autocomplete, Pagination, Snackbar, Alert, 
  Tabs, Tab, Paper, Tooltip, IconButton 
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TuneIcon from '@mui/icons-material/Tune';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FranceTravailJobOffer, searchOffers, SearchParams, 
  SmartMatchOffer, getSmartMatches 
} from "../../api/myJobBoard/features/jobBoard/jobBoardApi";
import { UserProfile, getProfile } from "../../api/myJobBoard/features/profile/profileApi";
import { createJobAlert } from "../../api/myJobBoard/features/jobAlerts/jobAlertsApi";
import { createCompany } from "../../api/myJobBoard/features/companies/companiesApi";
import { createOpportunity } from "../../api/myJobBoard/features/opportunities/opportunitiesApi";
import { ApplicationType, EOpportunityState } from "../../models/opportunities/Opportunity";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c);
}

export const JobBoardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const navigate = useNavigate();

  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // SMART MATCHING STATE
  const [smartMatches, setSmartMatches] = useState<SmartMatchOffer[]>([]);
  const [selectedSmartMatch, setSelectedSmartMatch] = useState<SmartMatchOffer | null>(null);
  const [smartLoading, setSmartLoading] = useState<boolean>(false);
  const [smartHasScanned, setSmartHasScanned] = useState<boolean>(false);

  // CLASSIC SEARCH STATE
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<FranceTravailJobOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<FranceTravailJobOffer | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filters
  const [locationType, setLocationType] = useState<"home" | "city" | "">("");
  const [rayon, setRayon] = useState<number>(10);
  const [typeContrat, setTypeContrat] = useState("");
  const [experience, setExperience] = useState("");
  const [publishDate, setPublishDate] = useState<number | "">("");
  const [remoteMode, setRemoteMode] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [page, setPage] = useState(1);
  const [creatingOpp, setCreatingOpp] = useState(false);
  const [snack, setSnack] = useState<{open: boolean; message: string; severity: "success" | "error"}>({ open: false, message: "", severity: "success" });
  
  // City Search
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [cityInputValue, setCityInputValue] = useState("");
  const [selectedCity, setSelectedCity] = useState<any>(null);

  useEffect(() => {
    getProfile().then(p => {
      setProfile(p);
      if (p.cityCode) {
        setLocationType("home");
      }
      // Auto-trigger smart match on initial load if user has role or title
      triggerSmartScan(p);
    }).catch(e => console.error(e));
  }, []);

  const triggerSmartScan = async (userProf?: UserProfile | null) => {
    const p = userProf || profile;
    setSmartLoading(true);
    setSmartHasScanned(true);

    try {
      const response = await getSmartMatches({
        keyword: p?.targetHorizonRole || p?.jobTitle,
        cityCode: p?.cityCode,
        rayon: 25,
        latitude: p?.latitude,
        longitude: p?.longitude,
        includeAiVerdict: true,
        limit: 15
      });

      setSmartMatches(response.matches || []);
      if (response.matches && response.matches.length > 0) {
        setSelectedSmartMatch(response.matches[0]);
      } else {
        setSelectedSmartMatch(null);
      }
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        message: "Erreur lors du scan intelligent. Vérifiez vos clés d'API.",
        severity: "error"
      });
    } finally {
      setSmartLoading(false);
    }
  };

  useEffect(() => {
    const fetchCities = async (query: string) => {
      if (!query || query.length < 3) {
        setCityOptions([]);
        return;
      }
      try {
        const res = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=5`);
        setCityOptions(res.data.features || []);
      } catch (e) {}
    };
    const delayDebounce = setTimeout(() => {
      if (locationType === "city") fetchCities(cityInputValue);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [cityInputValue, locationType]);

  const handleSearch = async (targetPage = 1) => {
    setLoading(true);
    setHasSearched(true);
    
    const params: SearchParams = {
      keyword: keyword || undefined,
      typeContrat: typeContrat || undefined,
      experience: experience || undefined,
      publishDate: publishDate || undefined,
      remoteMode: remoteMode || undefined,
      educationLevel: educationLevel || undefined,
      page: targetPage,
      rayon: rayon
    };

    if (locationType === "home" && profile?.cityCode) {
      params.commune = profile.cityCode;
    } else if (locationType === "city" && selectedCity) {
      params.commune = selectedCity.properties.citycode;
    } else {
      params.rayon = undefined;
    }

    try {
      const response = await searchOffers(params);
      setOffers(response.resultats || []);
      if (response.resultats && response.resultats.length > 0) {
        setSelectedOffer(response.resultats[0]);
      } else {
        setSelectedOffer(null);
      }
      setPage(targetPage);
    } catch (error) {
      console.error(error);
      setSnack({ open: true, message: "Erreur lors de la recherche.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    const name = window.prompt("Donnez un nom à cette recherche (ex: Développeur React Paris) :");
    if (!name) return;

    const params: SearchParams = {
      keyword: keyword || undefined,
      typeContrat: typeContrat || undefined,
      experience: experience || undefined,
      publishDate: publishDate || undefined,
      remoteMode: remoteMode || undefined,
      educationLevel: educationLevel || undefined,
      rayon: rayon
    };

    if (locationType === "home" && profile?.cityCode) {
      params.commune = profile.cityCode;
    } else if (locationType === "city" && selectedCity) {
      params.commune = selectedCity.properties.citycode;
    }

    try {
      await createJobAlert(name, params);
      setSnack({ open: true, message: "Recherche sauvegardée avec succès !", severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, message: "Erreur lors de la sauvegarde.", severity: "error" });
    }
  };

  const handleCreateOpportunityFromSmartMatch = async (match: SmartMatchOffer) => {
    setCreatingOpp(true);
    try {
      let companyId: string | undefined = undefined;

      if (match.companyName && match.companyName !== "Entreprise confidentielle") {
        const createdCompany = await createCompany({ name: match.companyName });
        companyId = createdCompany.id;
      }

      const jobOfferDetails = [
        match.description,
        match.salaryText ? `\n\nSalaire : ${match.salaryText}` : "",
        match.contractType ? `\nType de contrat : ${match.contractType}` : "",
        match.externalUrl ? `\n\nOffre originale : ${match.externalUrl}` : "",
        match.aiCoachVerdict ? `\n\n--- Conseil du Coach IA ---\n${match.aiCoachVerdict}` : "",
        match.tailoredPitch ? `\n\n--- Pitch d'accroche ---\n${match.tailoredPitch}` : ""
      ].join("").trim();

      const newOpportunity = await createOpportunity({
        roleTitle: match.title,
        startDate: new Date(),
        lastUpdateDate: new Date(),
        state: EOpportunityState.APPLIED,
        companyId,
        location: match.location,
        relatedApplication: {
          type: ApplicationType.JobOffer,
          linkToJobOffer: match.externalUrl,
          jobOfferDetails,
        },
      });

      setSnack({ open: true, message: "Opportunité ajoutée avec succès !", severity: "success" });
      setTimeout(() => navigate(`/opportunities/${newOpportunity.id}`), 700);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Erreur lors de la création de l'opportunité.", severity: "error" });
    } finally {
      setCreatingOpp(false);
    }
  };

  const handleCreateOpportunity = async (offer: FranceTravailJobOffer) => {
    setCreatingOpp(true);
    try {
      let companyId: string | undefined = undefined;

      if (offer.entreprise?.nom) {
        const createdCompany = await createCompany({ name: offer.entreprise.nom });
        companyId = createdCompany.id;
      }

      const jobOfferDetails = [
        offer.description,
        offer.salaire?.libelle ? `\n\nSalaire : ${offer.salaire.libelle}` : "",
        offer.salaire?.commentaire ? `\n${offer.salaire.commentaire}` : "",
        offer.experienceLibelle ? `\nExpérience requise : ${offer.experienceLibelle}` : "",
        offer.typeContratLibelle ? `\nType de contrat : ${offer.typeContratLibelle}` : "",
        offer.origineOffre?.urlOrigine ? `\n\nOffre originale : ${offer.origineOffre.urlOrigine}` : "",
      ].join("").trim();

      const newOpportunity = await createOpportunity({
        roleTitle: offer.intitule,
        startDate: new Date(),
        lastUpdateDate: new Date(),
        state: EOpportunityState.APPLIED,
        companyId,
        location: offer.lieuTravail?.libelle,
        relatedApplication: {
          type: ApplicationType.JobOffer,
          linkToJobOffer: offer.origineOffre?.urlOrigine,
          jobOfferDetails,
        },
      });

      setSnack({ open: true, message: "Opportunité créée avec succès !", severity: "success" });
      setTimeout(() => navigate(`/opportunities/${newOpportunity.id}`), 700);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Erreur lors de la création de l'opportunité.", severity: "error" });
    } finally {
      setCreatingOpp(false);
    }
  };

  const handleCopyPitch = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setSnack({ open: true, message: "Pitch d'accroche copié dans le presse-papier !", severity: "success" });
  };

  const renderDistance = (offer: FranceTravailJobOffer) => {
    if (!profile?.latitude || !profile?.longitude) return null;
    if (!offer.lieuTravail?.latitude || !offer.lieuTravail?.longitude) return null;
    
    const dist = calculateDistance(profile.latitude, profile.longitude, offer.lieuTravail.latitude, offer.lieuTravail.longitude);
    return <Chip icon={<LocationOnIcon />} label={`à ${dist} km`} size="small" color="secondary" variant="outlined" />;
  };

  return (
    <>
      <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Chasseur d'Emploi Intelligent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explorez les opportunités France Travail qualifiées par vos ambitions et vos priorités décisionnelles.
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<TuneIcon />} 
            onClick={() => navigate('/profile')}
          >
            Ajuster mon Career DNA
          </Button>
        </Box>

        <Paper sx={{ mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, val) => setActiveTab(val)} 
            indicatorColor="primary" 
            textColor="primary"
          >
            <Tab 
              icon={<AutoAwesomeIcon />} 
              iconPosition="start" 
              label="Recommandations IA (Career DNA)" 
            />
            <Tab 
              icon={<SearchIcon />} 
              iconPosition="start" 
              label="Recherche Manuelle Traditionnelle" 
            />
          </Tabs>
        </Paper>

        {/* TAB 0 : SMART MATCHING IA */}
        {activeTab === 0 && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top Bar with Profile Context & Scan Button */}
            <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, bgcolor: '#fbfcfd' }}>
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <Typography variant="subtitle2" color="text.secondary">
                  Cible active :
                </Typography>
                <Chip 
                  label={profile?.targetHorizonRole || profile?.jobTitle || "Développeur"} 
                  color="primary" 
                  size="small" 
                  icon={<RocketLaunchIcon />} 
                />
                {profile?.coreSkills && profile.coreSkills.length > 0 && (
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {profile.coreSkills.slice(0, 3).map((s, idx) => (
                      <Chip key={idx} label={s} size="small" variant="outlined" color="success" />
                    ))}
                  </Box>
                )}
                {profile?.enableTradeOffAlerts && (
                  <Chip label="Mode Coup de Cœur actif" size="small" color="warning" variant="outlined" />
                )}
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={smartLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                onClick={() => triggerSmartScan()}
                disabled={smartLoading}
              >
                {smartLoading ? "Analyse en cours..." : "Relancer le Scan IA"}
              </Button>
            </Paper>

            {/* Smart Matches Master-Detail View */}
            <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
              {/* Left Column: Smart Match Cards */}
              <Grid item xs={12} md={5} sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {smartMatches.length === 0 && !smartLoading && smartHasScanned && (
                  <Typography color="textSecondary" align="center" sx={{ mt: 5 }}>
                    Aucune opportunité ne correspond actuellement à vos filtres et vetos stricts.
                  </Typography>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
                  {smartMatches.map(match => {
                    const isSelected = selectedSmartMatch?.id === match.id;
                    const scoreColor = match.globalFitScore >= 80 ? '#2e7d32' : (match.globalFitScore >= 65 ? '#ed6c02' : '#757575');

                    return (
                      <Card
                        key={match.id}
                        onClick={() => setSelectedSmartMatch(match)}
                        sx={{
                          cursor: 'pointer',
                          border: isSelected ? '2px solid' : '1px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          boxShadow: isSelected ? 3 : 1,
                          transition: 'all 0.2s',
                          '&:hover': { boxShadow: 4 }
                        }}
                      >
                        <CardContent sx={{ pb: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
                            <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: '75%' }}>
                              {match.title}
                            </Typography>
                            <Box 
                              sx={{ 
                                bgcolor: scoreColor, 
                                color: '#fff', 
                                px: 1.2, 
                                py: 0.3, 
                                borderRadius: 1.5, 
                                fontWeight: 'bold', 
                                fontSize: '0.85rem' 
                              }}
                            >
                              {match.globalFitScore}% Fit
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                            {match.companyName} • {match.location || "France"}
                          </Typography>

                          {/* Category Badge */}
                          <Box mb={1.5} display="flex" gap={1} flexWrap="wrap">
                            {match.hasSignificantTradeOff ? (
                              <Chip 
                                icon={<WarningAmberIcon fontSize="small" />} 
                                label="Opportunité avec compromis" 
                                size="small" 
                                color="warning" 
                                variant="filled" 
                              />
                            ) : (
                              match.globalFitScore >= 85 ? (
                                <Chip 
                                  icon={<CheckCircleOutlineIcon fontSize="small" />} 
                                  label="Match Idéal" 
                                  size="small" 
                                  color="success" 
                                  variant="filled" 
                                />
                              ) : null
                            )}
                            <Chip label={match.contractType || "Contrat"} size="small" variant="outlined" />
                            {match.distanceKm !== null && match.distanceKm !== undefined && (
                              <Chip label={`${match.distanceKm} km`} size="small" variant="outlined" />
                            )}
                          </Box>

                          {/* Strong points snippet */}
                          {match.strongPoints && match.strongPoints.length > 0 && (
                            <Typography variant="caption" color="success.main" display="block" noWrap>
                              🟢 {match.strongPoints[0]}
                            </Typography>
                          )}
                          {match.frictionPoints && match.frictionPoints.length > 0 && (
                            <Typography variant="caption" color="warning.main" display="block" noWrap>
                              ⚠️ {match.frictionPoints[0]}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Grid>

              {/* Right Column: Detailed Match View */}
              <Grid item xs={12} md={7} sx={{ height: '100%' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {selectedSmartMatch ? (
                    <>
                      {/* Header */}
                      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                          <Box>
                            <Typography variant="h5" fontWeight="bold">{selectedSmartMatch.title}</Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                              {selectedSmartMatch.companyName} • {selectedSmartMatch.location}
                            </Typography>
                            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip label={selectedSmartMatch.contractType || "Contrat"} color="primary" />
                              {selectedSmartMatch.salaryText && (
                                <Chip label={selectedSmartMatch.salaryText} color="success" variant="outlined" />
                              )}
                              <Chip label={`Fit Score : ${selectedSmartMatch.globalFitScore}%`} color="secondary" />
                            </Box>
                          </Box>

                          <Button
                            variant="contained"
                            color="secondary"
                            startIcon={creatingOpp ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                            disabled={creatingOpp}
                            onClick={() => handleCreateOpportunityFromSmartMatch(selectedSmartMatch)}
                          >
                            {creatingOpp ? "Ajout..." : "Créer Opportunité"}
                          </Button>
                        </Box>
                      </Box>

                      {/* Scrollable Content */}
                      <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                        {/* COACH AI ARBITRAGE CARD */}
                        {selectedSmartMatch.aiCoachVerdict && (
                          <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#f4f6fc', borderLeft: '4px solid #3f51b5', borderRadius: 1.5 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <PsychologyIcon color="primary" />
                              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                L'Analyse & Arbitrage du Coach IA
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                              {selectedSmartMatch.aiCoachVerdict}
                            </Typography>
                          </Paper>
                        )}

                        {/* TAILORED APPLICATION PITCH */}
                        {selectedSmartMatch.tailoredPitch && (
                          <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#f0fdf4', borderLeft: '4px solid #16a34a', borderRadius: 1.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2" fontWeight="bold" color="success.dark">
                                💬 Pitch d'Accroche Recommandé (Prêt à envoyer)
                              </Typography>
                              <Tooltip title="Copier le pitch">
                                <IconButton size="small" onClick={() => handleCopyPitch(selectedSmartMatch.tailoredPitch)}>
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#166534' }}>
                              "{selectedSmartMatch.tailoredPitch}"
                            </Typography>
                          </Paper>
                        )}

                        {/* DETAILED STRONG POINTS & FRICTIONS */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="success.main" fontWeight="bold" gutterBottom>
                              🟢 Atouts & Alignement Profil
                            </Typography>
                            {selectedSmartMatch.strongPoints.map((sp, i) => (
                              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                                • {sp}
                              </Typography>
                            ))}
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="warning.main" fontWeight="bold" gutterBottom>
                              ⚠️ Frictions & Compromis
                            </Typography>
                            {selectedSmartMatch.frictionPoints.length > 0 ? (
                              selectedSmartMatch.frictionPoints.map((fp, i) => (
                                <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                                  • {fp}
                                </Typography>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Aucun point de friction majeur détecté.
                              </Typography>
                            )}
                          </Grid>
                        </Grid>

                        {/* FULL DESCRIPTION */}
                        <Typography variant="h6" gutterBottom>Description de l'offre</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 3, color: 'text.secondary' }}>
                          {selectedSmartMatch.description}
                        </Typography>

                        {selectedSmartMatch.externalUrl && (
                          <Button 
                            variant="outlined" 
                            endIcon={<OpenInNewIcon />} 
                            href={selectedSmartMatch.externalUrl} 
                            target="_blank"
                          >
                            Consulter l'offre originale
                          </Button>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="textSecondary">Sélectionnez une offre pour voir l'arbitrage complet</Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 1 : CLASSIC SEARCH */}
        {activeTab === 1 && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField 
                label="Mots-clés (ex: développeur react)" 
                variant="outlined" 
                sx={{ flexGrow: 1, minWidth: '250px' }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
              />
              
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Type de contrat</InputLabel>
                <Select value={typeContrat} label="Type de contrat" onChange={(e) => setTypeContrat(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="CDI">CDI</MenuItem>
                  <MenuItem value="CDD">CDD</MenuItem>
                  <MenuItem value="MIS">Intérim</MenuItem>
                  <MenuItem value="SAI">Saisonnier</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Expérience</InputLabel>
                <Select value={experience} label="Expérience" onChange={(e) => setExperience(e.target.value)}>
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="1">Débutant ({"<"} 1 an)</MenuItem>
                  <MenuItem value="2">Expérimenté (1 à 3 ans)</MenuItem>
                  <MenuItem value="3">Très expérimenté ({">"} 3 ans)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Date de pub.</InputLabel>
                <Select value={publishDate} label="Date de pub." onChange={(e) => setPublishDate(e.target.value as any)}>
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value={1}>Moins de 24h</MenuItem>
                  <MenuItem value={3}>Moins de 3 jours</MenuItem>
                  <MenuItem value={7}>Moins de 7 jours</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Télétravail</InputLabel>
                <Select value={remoteMode} label="Télétravail" onChange={(e) => setRemoteMode(e.target.value)}>
                  <MenuItem value="">Peu importe</MenuItem>
                  <MenuItem value="true">Requis</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Niveau d'étude</InputLabel>
                <Select value={educationLevel} label="Niveau d'étude" onChange={(e) => setEducationLevel(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="9">Cadre / Bac+5</MenuItem>
                  <MenuItem value="0">Employé / Ouvrier</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Localisation</InputLabel>
                <Select value={locationType} label="Localisation" onChange={(e) => setLocationType(e.target.value as any)}>
                  <MenuItem value="">Peu importe</MenuItem>
                  <MenuItem value="home" disabled={!profile?.cityCode}>Autour de mon domicile</MenuItem>
                  <MenuItem value="city">Autour d'une ville</MenuItem>
                </Select>
              </FormControl>

              {locationType === "city" && (
                <Autocomplete
                  sx={{ width: 300 }}
                  options={cityOptions}
                  getOptionLabel={(option) => option.properties?.label || ""}
                  filterOptions={(x) => x}
                  value={selectedCity}
                  onInputChange={(_, newInputValue) => setCityInputValue(newInputValue)}
                  onChange={(_, newValue) => setSelectedCity(newValue)}
                  renderInput={(params) => <TextField {...params} label="Ville" />}
                  renderOption={(props, option) => (
                    <li {...props} key={option.properties.id}>
                      {option.properties.label} ({option.properties.context})
                    </li>
                  )}
                />
              )}

              {locationType !== "" && (
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Rayon (km)</InputLabel>
                  <Select value={rayon} label="Rayon (km)" onChange={(e) => setRayon(Number(e.target.value))}>
                    <MenuItem value={5}>5 km</MenuItem>
                    <MenuItem value={10}>10 km</MenuItem>
                    <MenuItem value={20}>20 km</MenuItem>
                    <MenuItem value={50}>50 km</MenuItem>
                    <MenuItem value={100}>100 km</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Button 
                variant="contained" 
                color="primary" 
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                onClick={() => handleSearch(1)}
                disabled={loading}
                sx={{ ml: 'auto', minWidth: 150 }}
              >
                Rechercher
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                startIcon={<BookmarkAddIcon />}
                onClick={handleSaveSearch}
              >
                Sauvegarder
              </Button>
            </Box>

            <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Grid item xs={12} md={5} sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {offers.length === 0 && !loading && hasSearched && (
                  <Typography color="textSecondary" align="center" sx={{ mt: 5 }}>
                    Aucune offre à afficher.
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2, flexGrow: 1 }}>
                  {offers.map(offer => (
                    <Card 
                      key={offer.id} 
                      sx={{ 
                        cursor: 'pointer', 
                        border: selectedOffer?.id === offer.id ? '2px solid' : '1px solid',
                        borderColor: selectedOffer?.id === offer.id ? 'primary.main' : 'divider',
                      }}
                      onClick={() => setSelectedOffer(offer)}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" noWrap>
                          {offer.intitule}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" noWrap sx={{ mb: 1 }}>
                          {offer.entreprise?.nom || "Entreprise confidentielle"} • {offer.lieuTravail?.libelle}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={offer.typeContratLibelle || offer.typeContrat || "Contrat"} size="small" color="primary" variant="outlined" />
                          {renderDistance(offer)}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                
                {offers.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                     <Pagination count={10} page={page} onChange={(_, val) => handleSearch(val)} color="primary" />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={7} sx={{ height: '100%' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {selectedOffer ? (
                    <>
                      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" gutterBottom>{selectedOffer.intitule}</Typography>
                          <Typography variant="subtitle1" color="textSecondary">
                            {selectedOffer.entreprise?.nom || "Confidentiel"} • {selectedOffer.lieuTravail?.libelle}
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip label={selectedOffer.typeContratLibelle || selectedOffer.typeContrat} color="primary" />
                            {selectedOffer.experienceLibelle && <Chip label={selectedOffer.experienceLibelle} />}
                            {selectedOffer.salaire?.libelle && <Chip label={selectedOffer.salaire.libelle} color="success" variant="outlined" />}
                            {renderDistance(selectedOffer)}
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={creatingOpp ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                          disabled={creatingOpp}
                          onClick={() => handleCreateOpportunity(selectedOffer)}
                        >
                          {creatingOpp ? "Création..." : "Créer Opportunité"}
                        </Button>
                      </Box>
                      <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>Description du poste</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>{selectedOffer.description}</Typography>
                        {selectedOffer.origineOffre?.urlOrigine && (
                          <Button variant="outlined" endIcon={<OpenInNewIcon />} href={selectedOffer.origineOffre.urlOrigine} target="_blank">
                            Voir l'offre originale
                          </Button>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="textSecondary">Sélectionnez une offre pour voir les détails</Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(prev => ({ ...prev, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};

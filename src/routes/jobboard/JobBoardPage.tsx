import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Grid, Card, CardContent, CircularProgress, Chip, MenuItem, FormControl, InputLabel, Select, Autocomplete, Pagination, Snackbar, Alert } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FranceTravailJobOffer, searchOffers, SearchParams } from "../../api/myJobBoard/features/jobBoard/jobBoardApi";
import { UserProfile, getProfile } from "../../api/myJobBoard/features/profile/profileApi";
import { createJobAlert, getJobAlerts, JobAlert } from "../../api/myJobBoard/features/jobAlerts/jobAlertsApi";
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
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<FranceTravailJobOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<FranceTravailJobOffer | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
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
  const navigate = useNavigate();
  
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
    }).catch(e => console.error(e));
  }, []);

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
      alert("Erreur lors de la recherche. Avez-vous configuré vos clés API ?");
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
      alert("Recherche sauvegardée avec succès !");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const handleCreateOpportunity = async (offer: FranceTravailJobOffer) => {
    setCreatingOpp(true);
    try {
      let companyId: string | undefined = undefined;

      // Step 1: Create company if named
      if (offer.entreprise?.nom) {
        const createdCompany = await createCompany({ name: offer.entreprise.nom });
        companyId = createdCompany.id;
      }

      // Step 2: Build job offer details string
      const jobOfferDetails = [
        offer.description,
        offer.salaire?.libelle ? `\n\nSalaire : ${offer.salaire.libelle}` : "",
        offer.salaire?.commentaire ? `\n${offer.salaire.commentaire}` : "",
        offer.experienceLibelle ? `\nExpérience requise : ${offer.experienceLibelle}` : "",
        offer.typeContratLibelle ? `\nType de contrat : ${offer.typeContratLibelle}` : "",
        offer.origineOffre?.urlOrigine ? `\n\nOffre originale : ${offer.origineOffre.urlOrigine}` : "",
      ].join("").trim();

      // Step 3: Create opportunity pre-filled with all offer data
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

  const renderDistance = (offer: FranceTravailJobOffer) => {
    if (!profile?.latitude || !profile?.longitude) return null;
    if (!offer.lieuTravail?.latitude || !offer.lieuTravail?.longitude) return null;
    
    const dist = calculateDistance(profile.latitude, profile.longitude, offer.lieuTravail.latitude, offer.lieuTravail.longitude);
    return <Chip icon={<LocationOnIcon />} label={`à ${dist} km`} size="small" color="secondary" variant="outlined" />;
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
        Recherche d'offres
      </Typography>

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
  );
};

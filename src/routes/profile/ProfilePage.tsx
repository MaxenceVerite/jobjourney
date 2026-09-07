import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, TextField, Button, CircularProgress, Grid, MenuItem, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { UserProfile, getProfile, updateProfile } from "../../api/myJobBoard/features/profile/profileApi";
import myJobBoardApiClient from "../../api/myJobBoard/apiClient";
import { useDispatch } from "react-redux";
import { enqueueNotification } from "../../store/slices/notificationSlice";
import { Autocomplete } from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';

const jobTitles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "Designer",
  "Marketing Manager",
  "Sales Representative",
  "Other"
];

const remotePreferences = ["Full Remote", "Hybride", "Sur site", "Peu importe"];

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [linkedInText, setLinkedInText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);

  const [addressOptions, setAddressOptions] = useState<any[]>([]);
  const [addressInputValue, setAddressInputValue] = useState("");

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchAddresses = async (query: string) => {
      if (!query || query.length < 3) {
        setAddressOptions([]);
        return;
      }
      try {
        const res = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        setAddressOptions(res.data.features || []);
      } catch (e) {
        console.error(e);
      }
    };
    const delayDebounce = setTimeout(() => {
      fetchAddresses(addressInputValue);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [addressInputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setProfile((prev) => prev ? {
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    } : null);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile);
      dispatch(enqueueNotification({
        message: "Profil sauvegardé avec succès",
        severity: "success",
      }));
    } catch (err) {
      dispatch(enqueueNotification({
        message: "Erreur lors de la sauvegarde",
        severity: "error",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleAiParse = async () => {
    if (!linkedInText.trim()) return;
    setAiParsing(true);
    try {
      // Need to import myJobBoardApiClient or do it inline
      // We will do a direct fetch/axios via a local function or apiClient
      const response = await myJobBoardApiClient.post('/api/ai/parse-linkedin', { profileText: linkedInText });
      
      const parsedData = response.data;
      
      setProfile((prev) => prev ? {
        ...prev,
        firstName: parsedData.firstName || prev.firstName,
        lastName: parsedData.lastName || prev.lastName,
        jobTitle: parsedData.jobTitle || prev.jobTitle,
        experienceYears: parsedData.experienceYears || prev.experienceYears,
        linkedInUrl: parsedData.linkedInUrl || prev.linkedInUrl,
      } : null);

      dispatch(enqueueNotification({
        message: "Profil généré avec succès depuis LinkedIn",
        severity: "success",
      }));
      setAiDialogOpen(false);
      setLinkedInText("");
    } catch (err) {
      dispatch(enqueueNotification({
        message: "Erreur lors de l'extraction par l'IA",
        severity: "error",
      }));
    } finally {
      setAiParsing(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Mon Profil Candidat
      </Typography>
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Informations de base</Typography>
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setAiDialogOpen(true)}
            >
              Générer via LinkedIn
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ mb: 2, mt: 0 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Prénom" name="firstName" value={profile?.firstName || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nom" name="lastName" value={profile?.lastName || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Titre ciblé / Métier" name="jobTitle" value={profile?.jobTitle || ""} onChange={handleChange}>
              {jobTitles.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Années d'expérience" name="experienceYears" value={profile?.experienceYears || ""} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} mt={2}>
            <Typography variant="h6">Réseaux & Liens</Typography>
            <Divider sx={{ mb: 2, mt: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="URL LinkedIn" name="linkedInUrl" value={profile?.linkedInUrl || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Portfolio / GitHub" name="portfolioUrl" value={profile?.portfolioUrl || ""} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} mt={2}>
            <Typography variant="h6">Localisation</Typography>
            <Divider sx={{ mb: 2, mt: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={addressOptions}
              getOptionLabel={(option) => option.properties?.label || ""}
              filterOptions={(x) => x}
              value={profile?.address ? { properties: { label: profile.address } } : null}
              isOptionEqualToValue={(option, value) => option.properties?.label === value.properties?.label}
              onInputChange={(_, newInputValue) => {
                setAddressInputValue(newInputValue);
              }}
              onChange={(_, newValue) => {
                if (newValue) {
                  setProfile(prev => prev ? {
                    ...prev,
                    address: newValue.properties.label,
                    cityCode: newValue.properties.citycode,
                    latitude: newValue.geometry.coordinates[1],
                    longitude: newValue.geometry.coordinates[0],
                  } : null);
                } else {
                  setProfile(prev => prev ? {
                    ...prev,
                    address: undefined,
                    cityCode: undefined,
                    latitude: undefined,
                    longitude: undefined,
                  } : null);
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Adresse du domicile" fullWidth placeholder="Commencez à taper votre adresse..." />
              )}
              renderOption={(props, option) => {
                return (
                  <li {...props} key={option.properties.id}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ display: 'flex', width: 44 }}>
                        <LocationOnIcon sx={{ color: 'text.secondary' }} />
                      </Grid>
                      <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                        <Box component="span" sx={{ fontWeight: 'regular' }}>
                          {option.properties.label}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {option.properties.context}
                        </Typography>
                      </Grid>
                    </Grid>
                  </li>
                );
              }}
            />
          </Grid>

          <Grid item xs={12} mt={2}>
            <Typography variant="h6">Critères de recherche</Typography>
            <Divider sx={{ mb: 2, mt: 1 }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="number" label="Salaire Min (€)" name="salaryExpectationMin" value={profile?.salaryExpectationMin || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="number" label="Salaire Max (€)" name="salaryExpectationMax" value={profile?.salaryExpectationMax || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Préférence Remote" name="remotePreference" value={profile?.remotePreference || ""} onChange={handleChange}>
              {remotePreferences.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} mt={3}>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={saving} size="large">
              {saving ? "Sauvegarde..." : "Enregistrer mon profil"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={aiDialogOpen} onClose={() => !aiParsing && setAiDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Générer mon profil avec l'IA</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph sx={{ mt: 1 }}>
            Collez ci-dessous le texte brut de votre profil LinkedIn (ou le contenu de votre CV généré en PDF par LinkedIn). L'IA va extraire les données pour remplir votre profil !
          </Typography>
          <TextField
            multiline
            rows={8}
            fullWidth
            placeholder="Expérience : Développeur chez..."
            value={linkedInText}
            onChange={(e) => setLinkedInText(e.target.value)}
            disabled={aiParsing}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAiDialogOpen(false)} disabled={aiParsing}>Annuler</Button>
          <Button variant="contained" onClick={handleAiParse} disabled={aiParsing || !linkedInText.trim()}>
            {aiParsing ? <CircularProgress size={24} /> : "Générer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;

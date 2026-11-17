import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Paper, TextField, Button, CircularProgress, Grid, MenuItem, Divider, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Slider, Switch, FormControlLabel,
  Card, CardContent, Autocomplete
} from "@mui/material";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { useDispatch } from "react-redux";
import { UserProfile, getProfile, updateProfile } from "../../api/myJobBoard/features/profile/profileApi";
import myJobBoardApiClient from "../../api/myJobBoard/apiClient";
import { enqueueNotification } from "../../store/slices/notificationSlice";

const jobTitles = [
  "Software Engineer",
  "Tech Lead",
  "Fullstack Developer",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
  "Product Manager",
  "Data Scientist",
  "Designer",
  "Engineering Manager",
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

  // New tag inputs
  const [newCoreSkill, setNewCoreSkill] = useState("");
  const [newDesiredSkill, setNewDesiredSkill] = useState("");
  const [newVeto, setNewVeto] = useState("");

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile({
          ...data,
          coreSkills: data.coreSkills || [],
          desiredSkills: data.desiredSkills || [],
          vetoKeywords: data.vetoKeywords || [],
          weightSalary: data.weightSalary ?? 3,
          weightTechChallenge: data.weightTechChallenge ?? 4,
          weightWorkLifeBalance: data.weightWorkLifeBalance ?? 4,
          weightCareerGrowth: data.weightCareerGrowth ?? 3,
          enableTradeOffAlerts: data.enableTradeOffAlerts ?? true,
        });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setProfile((prev) => prev ? {
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    } : null);
  };

  const handleSliderChange = (name: keyof UserProfile) => (_: Event, value: number | number[]) => {
    setProfile(prev => prev ? {
      ...prev,
      [name]: Array.isArray(value) ? value[0] : value
    } : null);
  };

  const handleAddTag = (category: 'core' | 'desired' | 'veto') => {
    if (category === 'core' && newCoreSkill.trim()) {
      setProfile(prev => prev ? {
        ...prev,
        coreSkills: [...(prev.coreSkills || []), newCoreSkill.trim()]
      } : null);
      setNewCoreSkill("");
    } else if (category === 'desired' && newDesiredSkill.trim()) {
      setProfile(prev => prev ? {
        ...prev,
        desiredSkills: [...(prev.desiredSkills || []), newDesiredSkill.trim()]
      } : null);
      setNewDesiredSkill("");
    } else if (category === 'veto' && newVeto.trim()) {
      setProfile(prev => prev ? {
        ...prev,
        vetoKeywords: [...(prev.vetoKeywords || []), newVeto.trim()]
      } : null);
      setNewVeto("");
    }
  };

  const handleRemoveTag = (category: 'core' | 'desired' | 'veto', indexToRemove: number) => {
    setProfile(prev => {
      if (!prev) return null;
      if (category === 'core') {
        return { ...prev, coreSkills: prev.coreSkills?.filter((_, i) => i !== indexToRemove) };
      }
      if (category === 'desired') {
        return { ...prev, desiredSkills: prev.desiredSkills?.filter((_, i) => i !== indexToRemove) };
      }
      return { ...prev, vetoKeywords: prev.vetoKeywords?.filter((_, i) => i !== indexToRemove) };
    });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile);
      dispatch(enqueueNotification({
        message: "Profil & Préférences IA sauvegardés avec succès",
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
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Mon Profil & Career DNA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Paramétrez vos ambitions et vos priorités décisionnelles pour le moteur de matching intelligent.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="secondary" 
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setAiDialogOpen(true)}
        >
          Importer LinkedIn / CV
        </Button>
      </Box>

      {/* SECTION 1 : PSYCHOLOGIE DE CANDIDAT & ARBITRAGES */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <PsychologyIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Mes Piliers de Valeur (Psychologie Décisionnelle)
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Ajustez ce qui compte le plus pour vous aujourd'hui. L'algorithme compense un critère moins favorable par vos piliers prioritaires.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              💰 Rémunération & Avantages : <b>{profile?.weightSalary || 3} / 5</b>
            </Typography>
            <Slider 
              value={profile?.weightSalary || 3} 
              min={1} 
              max={5} 
              step={1} 
              marks 
              onChange={handleSliderChange('weightSalary')} 
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              🚀 Stack & Challenge Technique : <b>{profile?.weightTechChallenge || 4} / 5</b>
            </Typography>
            <Slider 
              value={profile?.weightTechChallenge || 4} 
              min={1} 
              max={5} 
              step={1} 
              marks 
              color="secondary"
              onChange={handleSliderChange('weightTechChallenge')} 
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              ⚖️ Équilibre de Vie & Télétravail : <b>{profile?.weightWorkLifeBalance || 4} / 5</b>
            </Typography>
            <Slider 
              value={profile?.weightWorkLifeBalance || 4} 
              min={1} 
              max={5} 
              step={1} 
              marks 
              color="success"
              onChange={handleSliderChange('weightWorkLifeBalance')} 
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              📈 Accélération de Carrière (Titre/Lead) : <b>{profile?.weightCareerGrowth || 3} / 5</b>
            </Typography>
            <Slider 
              value={profile?.weightCareerGrowth || 3} 
              min={1} 
              max={5} 
              step={1} 
              marks 
              color="warning"
              onChange={handleSliderChange('weightCareerGrowth')} 
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <FormControlLabel
              control={
                <Switch 
                  checked={profile?.enableTradeOffAlerts ?? true} 
                  onChange={(e) => setProfile(prev => prev ? { ...prev, enableTradeOffAlerts: e.target.checked } : null)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Mode "Opportunités Coup de Cœur" (Tolérance aux compromis positifs)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Présente les offres qui dévient légèrement de vos filtres si le salaire ou le rôle compense largement le défaut.
                  </Typography>
                </Box>
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 2 : AMBITIONS & TAXONOMIE DES COMPÉTENCES */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <RocketLaunchIcon color="secondary" />
          <Typography variant="h6" fontWeight="bold">
            Mon Cap & Mes Compétences
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Rôle Visé / Ambition à 1-2 ans" 
              name="targetHorizonRole" 
              placeholder="Ex: Tech Lead, Staff Engineer, Lead Frontend"
              value={profile?.targetHorizonRole || ""} 
              onChange={handleChange} 
              helperText="Priorise les offres correspondant à votre évolution plutôt qu'à votre passé."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              multiline
              rows={2}
              label="Passeport de Carrière (Manifeste en 150 mots)" 
              name="compactCareerManifesto" 
              placeholder="Ex: Développeur fullstack senior .NET/React cherchant à piloter une équipe dans une scale-up B2B..."
              value={profile?.compactCareerManifesto || ""} 
              onChange={handleChange} 
              helperText="Utilisé par l'IA pour générer vos argumentaires de candidature."
            />
          </Grid>

          {/* Core Skills */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.5} mb={1}>
              <CheckCircleIcon color="success" fontSize="small" /> Compétences Maîtrisées (Acquis)
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
              {profile?.coreSkills?.map((skill, index) => (
                <Chip 
                  key={index} 
                  label={skill} 
                  color="success" 
                  variant="outlined" 
                  onDelete={() => handleRemoveTag('core', index)} 
                />
              ))}
            </Box>
            <Box display="flex" gap={1} maxWidth={400}>
              <TextField 
                size="small" 
                placeholder="Ex: React, .NET 8, PostgreSQL..." 
                value={newCoreSkill}
                onChange={(e) => setNewCoreSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('core'))}
              />
              <Button variant="outlined" color="success" onClick={() => handleAddTag('core')} startIcon={<AddCircleOutlineIcon />}>
                Ajouter
              </Button>
            </Box>
          </Grid>

          {/* Desired Skills */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.5} mb={1}>
              <AutoAwesomeIcon color="primary" fontSize="small" /> Compétences Cibles (Envie d'apprendre / Travailler avec)
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
              {profile?.desiredSkills?.map((skill, index) => (
                <Chip 
                  key={index} 
                  label={skill} 
                  color="primary" 
                  variant="outlined" 
                  onDelete={() => handleRemoveTag('desired', index)} 
                />
              ))}
            </Box>
            <Box display="flex" gap={1} maxWidth={400}>
              <TextField 
                size="small" 
                placeholder="Ex: Go, Kubernetes, Azure Architecture..." 
                value={newDesiredSkill}
                onChange={(e) => setNewDesiredSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('desired'))}
              />
              <Button variant="outlined" color="primary" onClick={() => handleAddTag('desired')} startIcon={<AddCircleOutlineIcon />}>
                Ajouter
              </Button>
            </Box>
          </Grid>

          {/* Veto Keywords */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.5} mb={1}>
              <BlockIcon color="error" fontSize="small" /> Mots-clés Repoussoirs / Vetos (Éliminatoires)
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
              {profile?.vetoKeywords?.map((veto, index) => (
                <Chip 
                  key={index} 
                  label={veto} 
                  color="error" 
                  variant="outlined" 
                  onDelete={() => handleRemoveTag('veto', index)} 
                />
              ))}
            </Box>
            <Box display="flex" gap={1} maxWidth={400}>
              <TextField 
                size="small" 
                placeholder="Ex: ESN, SSII, WordPress, Astreinte..." 
                value={newVeto}
                onChange={(e) => setNewVeto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('veto'))}
              />
              <Button variant="outlined" color="error" onClick={() => handleAddTag('veto')} startIcon={<AddCircleOutlineIcon />}>
                Ajouter Veto
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 3 : INFORMATIONS DE BASE & FILTRES */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Informations de Base & Localisation
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Prénom" name="firstName" value={profile?.firstName || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nom" name="lastName" value={profile?.lastName || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Métier / Titre Actuel" name="jobTitle" value={profile?.jobTitle || ""} onChange={handleChange}>
              {jobTitles.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Années d'expérience" name="experienceYears" value={profile?.experienceYears || ""} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={addressOptions}
              getOptionLabel={(option) => option.properties?.label || ""}
              filterOptions={(x) => x}
              value={profile?.address ? { properties: { label: profile.address } } : null}
              isOptionEqualToValue={(option, value) => option.properties?.label === value.properties?.label}
              onInputChange={(_, newInputValue) => setAddressInputValue(newInputValue)}
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
              renderOption={(props, option) => (
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
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="number" label="Salaire Min Visé (€)" name="salaryExpectationMin" value={profile?.salaryExpectationMin || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="number" label="Salaire Max Visé (€)" name="salaryExpectationMax" value={profile?.salaryExpectationMax || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Préférence Remote" name="remotePreference" value={profile?.remotePreference || ""} onChange={handleChange}>
              {remotePreferences.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="URL LinkedIn" name="linkedInUrl" value={profile?.linkedInUrl || ""} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Portfolio / GitHub" name="portfolioUrl" value={profile?.portfolioUrl || ""} onChange={handleChange} />
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="flex-end" mb={6}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSave} 
          disabled={saving} 
          size="large"
          sx={{ px: 4, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
        >
          {saving ? "Sauvegarde en cours..." : "Enregistrer mon profil"}
        </Button>
      </Box>

      {/* AI PARSE DIALOG */}
      <Dialog open={aiDialogOpen} onClose={() => !aiParsing && setAiDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Générer mon profil avec l'IA</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph sx={{ mt: 1 }}>
            Collez ci-dessous le texte brut de votre profil LinkedIn ou votre CV. L'IA va extraire les données pour remplir votre profil !
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

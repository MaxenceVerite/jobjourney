import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Stack,
  InputAdornment,
  useTheme,
  alpha,
  Grid,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import EuroRoundedIcon from "@mui/icons-material/EuroRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { scrapeJob, JobImportResult } from "../../api/myJobBoard/features/opportunities/opportunitiesApi";
import { parseJobTextClientSide } from "../../helpers/clientJobParser";
import { JobAdapterRegistry } from "../../services/jobAdapters/JobAdapterRegistry";
import { createOpportunity } from "../../store/slices/opportunitySlice";
import { createCompany, getCompanies } from "../../store/slices/companySlice";
import { enqueueNotification } from "../../store/slices/notificationSlice";
import { NotificationSeverity } from "../../valueObjects/Notification";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import Opportunity, { EOpportunityState, RemoteCondition } from "../../models/opportunities/Opportunity";

interface SmartImportModalProps {
  onClose: () => void;
  onSubmit: () => void;
  initialState?: EOpportunityState;
  initialImportData?: Partial<JobImportResult>;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({
  onClose,
  onSubmit,
  initialState,
  initialImportData,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const companies = useSelector((state: RootState) => state.companies.companies);

  // Magic paste input state
  const [magicInput, setMagicInput] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionSuccess, setDetectionSuccess] = useState<string | null>(null);
  const [showExtensionHelp, setShowExtensionHelp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Opportunity Form Fields
  const [roleTitle, setRoleTitle] = useState<string>(initialImportData?.roleTitle || "");
  const [companyName, setCompanyName] = useState<string>(initialImportData?.companyName || "");
  const [location, setLocation] = useState<string>(initialImportData?.location || "");
  const [contractType, setContractType] = useState<string>((initialImportData as any)?.contractType || "CDI");
  const [remoteCondition, setRemoteCondition] = useState<RemoteCondition>(RemoteCondition.Office);
  const [salaryMin, setSalaryMin] = useState<string>((initialImportData as any)?.salaryMin || "");
  const [salaryMax, setSalaryMax] = useState<string>((initialImportData as any)?.salaryMax || "");
  const [sourceUrl, setSourceUrl] = useState<string>(initialImportData?.sourceUrl || "");
  const [skills, setSkills] = useState<string[]>((initialImportData as any)?.keySkills || (initialImportData as any)?.skills || []);
  const [description, setDescription] = useState<string>(initialImportData?.description || "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>((initialImportData as any)?.companyLogoUrl || "");
  const [sourceJobBoard, setSourceJobBoard] = useState<string>((initialImportData as any)?.sourceJobBoard || "");
  const [skillInput, setSkillInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch companies on mount
  useEffect(() => {
    if (companies.length === 0) {
      dispatch(getCompanies());
    }
  }, [dispatch, companies.length]);

  // Handle incoming import data (e.g. from extension)
  useEffect(() => {
    if (initialImportData) {
      if (initialImportData.roleTitle) setRoleTitle(initialImportData.roleTitle);
      if (initialImportData.companyName) setCompanyName(initialImportData.companyName);
      if (initialImportData.location) setLocation(initialImportData.location);
      if (initialImportData.sourceUrl) setSourceUrl(initialImportData.sourceUrl);
      if ((initialImportData as any).contractType) setContractType((initialImportData as any).contractType);
      if ((initialImportData as any).sourceJobBoard) setSourceJobBoard((initialImportData as any).sourceJobBoard);
      if ((initialImportData as any).companyLogoUrl) setCompanyLogoUrl((initialImportData as any).companyLogoUrl);
      if ((initialImportData as any).salaryMin) setSalaryMin(String((initialImportData as any).salaryMin));
      if ((initialImportData as any).salaryMax) setSalaryMax(String((initialImportData as any).salaryMax));
      if ((initialImportData as any).keySkills?.length) setSkills((initialImportData as any).keySkills);
      if (initialImportData.description) setDescription(initialImportData.description);
      setDetectionSuccess("Offre importée automatiquement !");
    }
  }, [initialImportData]);

  // Universal Magic Paste Handler (transparently handles URL, plain text, or page HTML)
  const handleMagicPaste = async (val: string) => {
    setMagicInput(val);
    setErrorMsg(null);
    const trimmed = val.trim();
    if (!trimmed) {
      setDetectionSuccess(null);
      return;
    }

    // 1. If it's a URL
    if ((trimmed.startsWith("http://") || trimmed.startsWith("https://")) && !trimmed.includes("\n")) {
      setSourceUrl(trimmed);
      setIsDetecting(true);
      try {
        const res = await scrapeJob({ url: trimmed });
        if (res.isProtectedDomain) {
          setErrorMsg(
            "Ce site bloque les lectures automatiques externes. Vous pouvez simplement copier-coller le texte de l'annonce ci-dessus, ou utiliser notre extension 1-clic."
          );
        } else {
          if (res.roleTitle) setRoleTitle(res.roleTitle);
          if (res.companyName) setCompanyName(res.companyName);
          if (res.location) setLocation(res.location);
          if (res.salaryMin) setSalaryMin(String(res.salaryMin));
          if (res.salaryMax) setSalaryMax(String(res.salaryMax));
          if (res.customApplicationType) setContractType(res.customApplicationType);
          if (res.keySkills && res.keySkills.length > 0) setSkills(res.keySkills);
          if (res.description) setDescription(res.description);
          setDetectionSuccess("Informations de l'offre récupérées !");
        }
      } catch (err: any) {
        setErrorMsg("Impossible de lire cette URL automatiquement. Collez le texte de l'offre ou remplissez les champs ci-dessous.");
      } finally {
        setIsDetecting(false);
      }
      return;
    }

    // 2. If it's HTML content from a supported job board
    if (trimmed.includes("<html") || trimmed.includes("<!DOCTYPE") || trimmed.includes("<body") || (trimmed.startsWith("<") && trimmed.includes(">"))) {
      try {
        const doc = new DOMParser().parseFromString(trimmed, "text/html");
        const extracted = JobAdapterRegistry.extract(doc, sourceUrl);
        if (extracted.title) setRoleTitle(extracted.title);
        if (extracted.company) setCompanyName(extracted.company);
        if (extracted.location) setLocation(extracted.location);
        if (extracted.contractType) setContractType(extracted.contractType);
        if (extracted.salaryMin) setSalaryMin(String(extracted.salaryMin));
        if (extracted.salaryMax) setSalaryMax(String(extracted.salaryMax));
        if (extracted.description) setDescription(extracted.description);
        if (extracted.skills && extracted.skills.length > 0) setSkills(extracted.skills);
        if (extracted.logoUrl) setCompanyLogoUrl(extracted.logoUrl);
        if (extracted.sourceJobBoard) setSourceJobBoard(extracted.sourceJobBoard);
        setDetectionSuccess(`Offre détectée avec succès (${extracted.sourceJobBoard || "Job Board"}) !`);
        return;
      } catch (e) {
        // Fall back to text parsing
      }
    }

    // 3. Plain text parsing (0 ms)
    setDescription(val);
    const parsed = parseJobTextClientSide(val);
    if (parsed.detectedTitle && !roleTitle) setRoleTitle(parsed.detectedTitle);
    if (parsed.detectedCompany && !companyName) setCompanyName(parsed.detectedCompany);
    if (parsed.detectedLocation && !location) setLocation(parsed.detectedLocation);
    if (parsed.contractType) setContractType(parsed.contractType);
    if (parsed.salaryMin && !salaryMin) setSalaryMin(String(parsed.salaryMin));
    if (parsed.salaryMax && !salaryMax) setSalaryMax(String(parsed.salaryMax));
    if (parsed.keySkills.length > 0 && skills.length === 0) setSkills(parsed.keySkills);
    if (parsed.remoteCondition) setRemoteCondition(parsed.remoteCondition);
    if (parsed.detectedSourceUrl && !sourceUrl) setSourceUrl(parsed.detectedSourceUrl);

    if (parsed.detectedTitle || parsed.detectedCompany) {
      setDetectionSuccess("Champs principaux détectés automatiquement !");
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (!skills.includes(trimmed)) {
        setSkills([...skills, trimmed]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    if (!roleTitle.trim()) {
      setErrorMsg("Veuillez indiquer au minimum le titre du poste.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMsg("Veuillez indiquer le nom de l'entreprise.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      // 1. Match or Create Company
      let companyId: string | undefined;
      const compTrim = companyName.trim();
      const existingCompany = companies.find(
        (c) => c.name.toLowerCase() === compTrim.toLowerCase()
      );

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const createCompAction = await dispatch(
          createCompany({
            company: {
              name: compTrim,
              websiteUrl: sourceUrl || undefined,
            },
          })
        );
        if (createCompany.fulfilled.match(createCompAction)) {
          companyId = createCompAction.payload.id;
        }
      }

      // 2. Format Salary
      const minVal = salaryMin ? parseFloat(salaryMin.replace(/\s+/g, "")) : undefined;
      const maxVal = salaryMax ? parseFloat(salaryMax.replace(/\s+/g, "")) : undefined;

      // 3. Create Opportunity
      const newOpp: Opportunity = {
        roleTitle: roleTitle.trim(),
        companyId: companyId,
        location: location.trim() || undefined,
        remoteCondition: remoteCondition,
        state: initialState || EOpportunityState.DRAFT,
        startDate: new Date(),
        lastUpdateDate: new Date(),
        freeNotes: description
          ? `${sourceUrl ? `Lien de l'offre : ${sourceUrl}\n\n` : ""}${description}`
          : undefined,
        indicativeSalaryRange: minVal || maxVal
          ? {
              min: minVal || maxVal || 0,
              max: maxVal,
              periodicity: "Yearly" as any,
            }
          : undefined,
        contractType: contractType.trim() || undefined,
        sourceJobBoard: sourceJobBoard || undefined,
        companyLogoUrl: companyLogoUrl || undefined,
        skills: skills.length > 0 ? skills : undefined,
      };

      await dispatch(createOpportunity({ opportunity: newOpp }));

      dispatch(
        enqueueNotification({
          message: `Opportunité "${roleTitle}" ajoutée à votre tableau !`,
          severity: NotificationSeverity.Success,
          duration: 4000,
        })
      );

      onSubmit();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'opportunité.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxHeight: "82vh", overflowY: "auto", pr: 0.5 }}>
      {/* --- MAGIC AUTO-FILL BANNER --- */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          background: alpha(theme.palette.primary.main, 0.05),
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
              Remplissage automatique (Optionnel)
            </Typography>
          </Box>
          <Button
            size="small"
            variant="text"
            startIcon={<ExtensionRoundedIcon />}
            onClick={() => setShowExtensionHelp(true)}
            sx={{ fontSize: "0.8rem", textTransform: "none", color: "text.secondary", fontWeight: 600 }}
          >
            Extension Chrome 1-clic ?
          </Button>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Collez ici le lien ou le texte d'une offre pour pré-remplir les champs ci-dessous..."
          value={magicInput}
          onChange={(e) => handleMagicPaste(e.target.value)}
          disabled={isDetecting || isSaving}
          InputProps={{
            endAdornment: isDetecting ? (
              <InputAdornment position="end">
                <CircularProgress size={18} />
              </InputAdornment>
            ) : null,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
            },
          }}
        />

        {detectionSuccess && (
          <Stack direction="row" spacing={1} alignItems="center" mt={1}>
            <Chip
              icon={<CheckCircleRoundedIcon />}
              label={detectionSuccess}
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            {sourceJobBoard && (
              <Chip label={sourceJobBoard} size="small" variant="outlined" color="primary" />
            )}
          </Stack>
        )}
      </Paper>

      {errorMsg && (
        <Alert severity="warning" onClose={() => setErrorMsg(null)} sx={{ mb: 2.5, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* --- MAIN OPPORTUNITY FORM --- */}
      <Grid container spacing={2}>
        {/* Post title */}
        <Grid item xs={12} sm={7}>
          <TextField
            required
            fullWidth
            label="Intitulé du poste"
            placeholder="Ex : Développeur Fullstack React"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
          />
        </Grid>

        {/* Company name */}
        <Grid item xs={12} sm={5}>
          <TextField
            required
            fullWidth
            label="Entreprise"
            placeholder="Ex : Google, Doctolib, Startup..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {companyLogoUrl ? (
                    <Avatar src={companyLogoUrl} alt={companyName} sx={{ width: 22, height: 22 }} />
                  ) : (
                    <BusinessRoundedIcon fontSize="small" color="action" />
                  )}
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Contract type */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Type de contrat"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
          >
            {["CDI", "CDD", "Freelance", "Stage", "Alternance", "Intérim", "Autre"].map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Remote condition */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Télétravail"
            value={remoteCondition}
            onChange={(e) => setRemoteCondition(e.target.value as RemoteCondition)}
          >
            <MenuItem value={RemoteCondition.Office}>Sur site</MenuItem>
            <MenuItem value={RemoteCondition.Hybrid}>Hybride</MenuItem>
            <MenuItem value={RemoteCondition.FullRemote}>Télétravail total</MenuItem>
          </TextField>
        </Grid>

        {/* Location */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Localisation"
            placeholder="Ex : Paris, Lyon, Remote..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Source URL */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Lien de l'offre (optionnel)"
            placeholder="https://..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LaunchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Salary Min / Max */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Salaire Min (€ brut/an)"
            placeholder="Ex : 45000"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EuroRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Salaire Max (€ brut/an)"
            placeholder="Ex : 55000"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EuroRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Key skills */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Compétences recherchées"
            placeholder="Ajoutez une compétence puis appuyez sur Entrée (ex : React, C#, SQL...)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleAddSkill}
          />
          {skills.length > 0 && (
            <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.8} mt={1}>
              {skills.map((skill, idx) => (
                <Chip
                  key={idx}
                  label={skill}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() => handleRemoveSkill(skill)}
                />
              ))}
            </Stack>
          )}
        </Grid>

        {/* Notes / Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes personnelles ou description de l'annonce"
            placeholder="Détails du poste, contact recruteur, points importants..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>
      </Grid>

      {/* --- ACTIONS --- */}
      <Box display="flex" justifyContent="flex-end" gap={2} mt={3} pt={2} borderTop={`1px solid ${theme.palette.divider}`}>
        <Button variant="text" color="inherit" onClick={onClose} disabled={isSaving} sx={{ fontWeight: 600 }}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
          disabled={isSaving || !roleTitle.trim() || !companyName.trim()}
          startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <AddRoundedIcon />}
          sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
        >
          {isSaving ? "Enregistrement..." : "Ajouter à mes opportunités"}
        </Button>
      </Box>

      {/* --- EXTENSION HELP POPUP DIALOG --- */}
      <Dialog
        open={showExtensionHelp}
        onClose={() => setShowExtensionHelp(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ExtensionRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Extension Chrome JobJourney
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setShowExtensionHelp(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            L'extension vous permet d'enregistrer n'importe quelle offre directement en <b>1 clic</b> depuis <b>LinkedIn, Indeed, Welcome to the Jungle, Apec ou France Travail</b>.
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Installation en 3 étapes rapides :
          </Typography>
          <Typography variant="body2" component="div" sx={{ lineHeight: 1.8 }}>
            1. Ouvrez <code>chrome://extensions</code> dans Chrome.<br />
            2. Activez le <b>Mode développeur</b> (en haut à droite).<br />
            3. Cliquez sur <b>Charger l'extension non empaquetée</b> et choisissez le dossier <code>extension</code> de JobJourney.<br />
            4. C'est prêt ! Cliquez sur l'icône sur une offre pour l'envoyer ici.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowExtensionHelp(false)} variant="contained" fullWidth sx={{ fontWeight: 700 }}>
            Compris !
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartImportModal;

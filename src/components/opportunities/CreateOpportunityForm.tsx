import React, { useState } from "react";
import {
  Button,
  Container,
  TextField,
  FormControl,
  MenuItem,
  Box,
  Typography,
  Grid,
  Chip,
  Stack,
  InputAdornment,
} from "@mui/material";
import Opportunity, {
  EOpportunityState,
  RemoteCondition,
} from "../../models/opportunities/Opportunity";
import CompanyPicker from "../compagnies/CompagnyPicker";
import { useDispatch } from "react-redux";
import { createOpportunity } from "../../store/slices/opportunitySlice";
import { useTranslation } from "react-i18next";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EuroRoundedIcon from "@mui/icons-material/EuroRounded";

interface CreateOpportunityFormProps {
  onClose: () => void;
  onSubmit: () => void;
  initialState?: EOpportunityState;
}

const CreateOpportunityForm = ({
  onClose,
  onSubmit,
  initialState,
}: CreateOpportunityFormProps) => {
  const [opportunityData, setOpportunityData] = useState<Opportunity>({
    roleTitle: "",
    startDate: new Date(),
    lastUpdateDate: new Date(),
    state: initialState || EOpportunityState.DRAFT,
    remoteCondition: RemoteCondition.Office,
    contractType: "CDI",
    sourceJobBoard: undefined,
    skills: [],
  });

  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [skillInput, setSkillInput] = useState<string>("");

  const dispatch = useDispatch<any>();
  const { t } = useTranslation();

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setOpportunityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (!opportunityData.skills?.includes(trimmed)) {
        setOpportunityData((prev) => ({
          ...prev,
          skills: [...(prev.skills || []), trimmed],
        }));
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setOpportunityData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = salaryMin ? parseFloat(salaryMin.replace(/\s+/g, "")) : undefined;
    const maxVal = salaryMax ? parseFloat(salaryMax.replace(/\s+/g, "")) : undefined;

    const finalOpp: Opportunity = {
      ...opportunityData,
      indicativeSalaryRange: minVal || maxVal ? {
        min: minVal || maxVal || 0,
        max: maxVal,
        periodicity: "Yearly" as any,
      } : undefined,
    };

    dispatch(createOpportunity({ opportunity: finalOpp }));
    onSubmit();
  };

  const handleCompanySelect = (companyId: string) => {
    setOpportunityData((prev) => ({ ...prev, companyId: companyId }));
  };

  return (
    <Container maxWidth="sm" sx={{ py: {xs: 1, sm: 2}, px: {xs: 1, sm: 3} }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: {xs: "0.85rem", sm: "0.875rem"} }}>
          Remplissez les informations ci-dessous pour ajouter manuellement une opportunité à votre tableau.
        </Typography>

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <CompanyPicker onCompanySelect={handleCompanySelect} />
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Titre du poste"
              placeholder="Ex: Développeur Fullstack C# / React"
              name="roleTitle"
              variant="outlined"
              value={opportunityData.roleTitle}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Type de contrat"
              name="contractType"
              value={opportunityData.contractType || "CDI"}
              onChange={handleInputChange}
            >
              {["CDI", "CDD", "Freelance", "Stage", "Alternance", "Intérim", "Autre"].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              value={opportunityData.remoteCondition}
              variant="outlined"
              id="remoteCondition"
              name="remoteCondition"
              select
              fullWidth
              label="Condition de télétravail"
              onChange={handleInputChange}
            >
              {Object.values(RemoteCondition).map((condition) => (
                <MenuItem key={condition} value={condition}>
                  {t(`RemoteCondition.${condition}`)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Salaire Min (€ brut/an)"
              placeholder="Ex: 45000"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EuroRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Salaire Max (€ brut/an)"
              placeholder="Ex: 55000"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EuroRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Provenance (Job Board)"
              name="sourceJobBoard"
              value={opportunityData.sourceJobBoard || ""}
              onChange={handleInputChange}
            >
              <MenuItem value="">Direct / Autre</MenuItem>
              <MenuItem value="Welcome to the Jungle">Welcome to the Jungle</MenuItem>
              <MenuItem value="LinkedIn">LinkedIn</MenuItem>
              <MenuItem value="Indeed">Indeed</MenuItem>
              <MenuItem value="Apec">Apec</MenuItem>
              <MenuItem value="France Travail">France Travail</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              id="startDate"
              label="Date de début"
              type="date"
              name="startDate"
              value={
                opportunityData.startDate instanceof Date
                  ? opportunityData.startDate.toISOString().split("T")[0]
                  : opportunityData.startDate || ""
              }
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Compétences (tapez Entrée pour ajouter)"
              placeholder="Ex: React, .NET, TypeScript..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
            />
            {opportunityData.skills && opportunityData.skills.length > 0 && (
              <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.8} mt={1}>
                {opportunityData.skills.map((skill) => (
                  <Chip
                    key={skill}
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
        </Grid>

        <Box display="flex" flexDirection={{xs: "column-reverse", sm: "row"}} justifyContent="flex-end" gap={2} mt={{xs: 3, sm: 5}}>
          <Button
            variant="text"
            color="inherit"
            fullWidth
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            sx={{ fontWeight: 600, textTransform: "none", width: {sm: "auto"} }}
          >
            Annuler
          </Button>
          <Button
            color="primary"
            type="submit"
            variant="contained"
            fullWidth
            startIcon={<AddRoundedIcon />}
            disabled={!opportunityData.roleTitle || !opportunityData.companyId}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(27, 44, 191, 0.2)",
              width: {sm: "auto"}
            }}
          >
            Ajouter
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateOpportunityForm;

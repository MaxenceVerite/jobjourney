import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  useTheme,
  alpha,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { useDispatch } from "react-redux";
import Company from "../../models/opportunities/Company";
import { createCompany, updateCompany } from "../../store/slices/companySlice";
import { searchCompanyGovApi, SireneResult } from "../../api/external/sireneApi";

import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

interface CompanyModalProps {
  company?: Company;
  onClose: () => void;
  onSuccess?: (createdOrUpdated: Company) => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  company,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const isEditing = Boolean(company?.id);

  const [name, setName] = useState(company?.name || "");
  const [websiteUrl, setWebsiteUrl] = useState(company?.websiteUrl || "");
  const [linkedinPageUrl, setLinkedinPageUrl] = useState(company?.linkedinPageUrl || "");
  const [nameError, setNameError] = useState("");
  
  // Gov API State
  const [options, setOptions] = useState<SireneResult[]>([]);
  const [selectedGovData, setSelectedGovData] = useState<SireneResult | null>(null);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (name.length >= 3) {
        const results = await searchCompanyGovApi(name);
        setOptions(results);
      } else {
        setOptions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Le nom de l'entreprise est obligatoire");
      return;
    }

    const payload: Company = {
      id: company?.id,
      name: name.trim(),
      websiteUrl: websiteUrl.trim() || undefined,
      linkedinPageUrl: linkedinPageUrl.trim() || undefined,
      siret: selectedGovData?.siren,
      address: selectedGovData ? `${selectedGovData.siege.adresse} ${selectedGovData.siege.code_postal} ${selectedGovData.siege.libelle_commune}` : undefined,
      industry: selectedGovData?.activite_principale,
      employeeCount: selectedGovData?.tranche_effectif_salarie,
    };

    try {
      if (isEditing) {
        await dispatch(updateCompany({ company: payload })).unwrap();
      } else {
        await dispatch(createCompany({ company: payload })).unwrap();
      }
      if (onSuccess) onSuccess(payload);
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement entreprise", err);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: "100%", maxWidth: 500, mx: "auto", p: { xs: 1, sm: 2 } }}
    >
      {/* Header icon preview */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          {name.trim() ? name.trim().charAt(0).toUpperCase() : <BusinessRoundedIcon />}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            {isEditing ? "Modifier l'entreprise" : "Nouvelle Entreprise"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isEditing
              ? "Mettez à jour les informations de l'entreprise"
              : "Ajoutez une entreprise cible à votre carnet"}
          </Typography>
        </Box>
      </Box>

      {/* Inputs */}
      <Box display="flex" flexDirection="column" gap={2.5}>
        <Autocomplete
          freeSolo
          options={options}
          getOptionLabel={(option) => typeof option === 'string' ? option : `${option.nom_complet} - ${option.siege?.libelle_commune || ''}`}
          filterOptions={(x) => x}
          value={selectedGovData || name}
          onChange={(event, newValue) => {
            if (typeof newValue === 'string') {
              setName(newValue);
              setSelectedGovData(null);
            } else if (newValue) {
              setName(newValue.nom_complet);
              setSelectedGovData(newValue);
            }
            if (nameError) setNameError("");
          }}
          onInputChange={(event, newInputValue) => {
            setName(newInputValue);
            if (nameError) setNameError("");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Nom de l'entreprise *"
              placeholder="Ex: Doctolib, Alan, Ledger..."
              error={Boolean(nameError)}
              helperText={nameError}
              fullWidth
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputBase-root": { borderRadius: 2 },
              }}
            />
          )}
        />

        <TextField
          label="Site Web"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LanguageRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiInputBase-root": { borderRadius: 2 },
          }}
        />

        <TextField
          label="Page LinkedIn"
          placeholder="https://linkedin.com/company/..."
          value={linkedinPageUrl}
          onChange={(e) => setLinkedinPageUrl(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkedInIcon fontSize="small" sx={{ color: "#0a66c2" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiInputBase-root": { borderRadius: 2 },
          }}
        />
      </Box>

      {/* Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={1.5} mt={3.5}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
          }}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            boxShadow: "0 4px 12px rgba(27, 44, 191, 0.2)",
          }}
        >
          {isEditing ? "Enregistrer" : "Créer l'entreprise"}
        </Button>
      </Box>
    </Box>
  );
};

export default CompanyModal;

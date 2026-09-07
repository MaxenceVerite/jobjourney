import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  MenuItem,
  useTheme,
  alpha,
  InputAdornment,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import Interlocutor from "../../models/opportunities/Interlocutor";
import { RootState } from "../../store/store";
import {
  createInterlocutor,
  updateInterlocutor,
} from "../../store/slices/interlocutorSlice";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

interface InterlocutorModalProps {
  interlocutor?: Interlocutor;
  preselectedCompanyId?: string;
  onClose: () => void;
  onSuccess?: (createdOrUpdated: Interlocutor) => void;
}

export const InterlocutorModal: React.FC<InterlocutorModalProps> = ({
  interlocutor,
  preselectedCompanyId,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const isEditing = Boolean(interlocutor?.id);

  const companies = useSelector((state: RootState) => state.companies.companies);

  const [firstName, setFirstName] = useState(interlocutor?.firstName || "");
  const [lastName, setLastName] = useState(interlocutor?.lastName || "");
  const [role, setRole] = useState(interlocutor?.role || "");
  const [companyId, setCompanyId] = useState(
    interlocutor?.companyId || preselectedCompanyId || ""
  );
  const [mail, setMail] = useState(interlocutor?.mail || "");
  const [phone, setPhone] = useState(interlocutor?.phone || "");
  const [linkedinProfile, setLinkedinProfile] = useState(
    interlocutor?.linkedinProfile || ""
  );

  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { firstName?: string; lastName?: string } = {};

    if (!firstName.trim()) newErrors.firstName = "Le prénom est obligatoire";
    if (!lastName.trim()) newErrors.lastName = "Le nom est obligatoire";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: Interlocutor = {
      id: interlocutor?.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role.trim() || undefined,
      companyId: companyId || undefined,
      mail: mail.trim() || undefined,
      phone: phone.trim() || undefined,
      linkedinProfile: linkedinProfile.trim() || undefined,
    };

    try {
      if (isEditing) {
        await dispatch(updateInterlocutor({ interlocutor: payload })).unwrap();
      } else {
        await dispatch(createInterlocutor({ interlocutor: payload })).unwrap();
      }
      if (onSuccess) onSuccess(payload);
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement interlocuteur", err);
    }
  };

  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: "100%", maxWidth: 540, mx: "auto", p: { xs: 1, sm: 2 } }}
    >
      {/* Header icon preview */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: alpha(theme.palette.secondary.main, 0.15),
            color: "primary.main",
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          {fullName ? (
            `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
          ) : (
            <PersonRoundedIcon />
          )}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            {isEditing ? "Modifier le contact" : "Nouvel Interlocuteur / Recruteur"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isEditing
              ? "Mettez à jour les coordonnées de votre contact"
              : "Ajoutez un recruteur, manager ou RH à votre réseau"}
          </Typography>
        </Box>
      </Box>

      {/* Inputs */}
      <Box display="flex" flexDirection="column" gap={2.2}>
        <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
          <TextField
            label="Prénom *"
            placeholder="Ex: Sophie"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors({ ...errors, firstName: undefined });
            }}
            error={Boolean(errors.firstName)}
            helperText={errors.firstName}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          />

          <TextField
            label="Nom *"
            placeholder="Ex: Martin"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors({ ...errors, lastName: undefined });
            }}
            error={Boolean(errors.lastName)}
            helperText={errors.lastName}
            fullWidth
            size="small"
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          />
        </Box>

        <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
          <TextField
            label="Rôle / Poste"
            placeholder="Ex: Lead Tech, Talent Recruiter, CTO..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WorkRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          />

          <TextField
            select
            label="Entreprise associée"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          >
            <MenuItem value="">
              <em>Aucune entreprise liée</em>
            </MenuItem>
            {companies.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
          <TextField
            label="Email"
            placeholder="contact@example.com"
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          />

          <TextField
            label="Téléphone"
            placeholder="06 12 34 56 78"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          />
        </Box>

        <TextField
          label="Profil LinkedIn"
          placeholder="https://linkedin.com/in/..."
          value={linkedinProfile}
          onChange={(e) => setLinkedinProfile(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkedInIcon fontSize="small" sx={{ color: "#0a66c2" }} />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
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
          {isEditing ? "Enregistrer" : "Créer le contact"}
        </Button>
      </Box>
    </Box>
  );
};

export default InterlocutorModal;

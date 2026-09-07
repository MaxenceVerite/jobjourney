import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Grid,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import Interlocutor from "../../models/opportunities/Interlocutor";
import { RootState } from "../../store/store";
import { deleteInterlocutor } from "../../store/slices/interlocutorSlice";
import { useModal } from "../../contexts/ModalContext";
import InterlocutorModal from "./InterlocutorModal";

import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

interface IndependentContactsViewProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

export const IndependentContactsView: React.FC<IndependentContactsViewProps> = ({
  onBack,
  showBackButton = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const { openModal, closeModal } = useModal();

  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement | null;
    interlocutor: Interlocutor | null;
  }>({ el: null, interlocutor: null });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const interlocutors = useSelector((state: RootState) =>
    state.interlocutors.interlocutors.filter((i) => !i.companyId)
  );

  const handleAddInterlocutor = () => {
    openModal(
      "Nouveau Contact / Chasseur de têtes",
      <InterlocutorModal onClose={closeModal} />
    );
  };

  const handleEditInterlocutor = (inter: Interlocutor) => {
    setMenuAnchor({ el: null, interlocutor: null });
    openModal(
      "Modifier le contact",
      <InterlocutorModal interlocutor={inter} onClose={closeModal} />
    );
  };

  const handleDeleteInterlocutor = (inter: Interlocutor) => {
    setMenuAnchor({ el: null, interlocutor: null });
    if (window.confirm(`Supprimer le contact ${inter.firstName} ${inter.lastName} ?`)) {
      if (inter.id) {
        dispatch(deleteInterlocutor({ id: inter.id }));
      }
    }
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {showBackButton && (
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={{
            mb: 2,
            textTransform: "none",
            fontWeight: 600,
            color: "text.secondary",
          }}
        >
          Retour à la liste des entreprises
        </Button>
      )}

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.08)",
          boxShadow: "0 4px 20px rgba(27, 44, 191, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: alpha(theme.palette.secondary.main, 0.15),
              color: "primary.main",
              borderRadius: 2.5,
            }}
          >
            <PeopleAltRoundedIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Chasseurs de têtes & Contacts indépendants
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recruteurs en cabinets, consultants et contacts non rattachés à une entreprise spécifique.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddRoundedIcon />}
          onClick={handleAddInterlocutor}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
          }}
        >
          Nouveau contact
        </Button>
      </Paper>

      {/* Grid of Contacts */}
      {interlocutors.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px dashed rgba(0,0,0,0.12)",
            textAlign: "center",
          }}
        >
          <Typography variant="h6" fontWeight={600} color="text.primary" mb={1}>
            Aucun contact indépendant
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Ajoutez ici les recruteurs externes ou chasseurs de têtes avec qui vous échangez.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PersonAddRoundedIcon />}
            onClick={handleAddInterlocutor}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Ajouter un contact indépendant
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {interlocutors.map((inter) => {
            const fullName = `${inter.firstName} ${inter.lastName}`.trim();
            const initials = `${inter.firstName?.charAt(0) || ""}${inter.lastName?.charAt(0) || ""}`.toUpperCase();

            return (
              <Grid item xs={12} sm={6} key={inter.id || fullName}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    "&:hover": {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      boxShadow: "0 4px 16px rgba(27, 44, 191, 0.06)",
                    },
                  }}
                >
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                    <Box display="flex" alignItems="center" gap={1.2}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: alpha(theme.palette.secondary.main, 0.15),
                          color: "primary.main",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {fullName}
                        </Typography>
                        {inter.role ? (
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {inter.role}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontStyle="italic">
                            Chasseur / Recruteur
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) =>
                        setMenuAnchor({
                          el: e.currentTarget,
                          interlocutor: inter,
                        })
                      }
                      sx={{ color: "text.secondary" }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Direct Contact Links */}
                  <Box display="flex" flexDirection="column" gap={0.8}>
                    {inter.mail && (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        p={0.6}
                        px={1}
                        borderRadius={1.5}
                        bgcolor="action.hover"
                      >
                        <Box
                          component="a"
                          href={`mailto:${inter.mail}`}
                          display="flex"
                          alignItems="center"
                          gap={0.8}
                          sx={{ textDecoration: "none", color: "inherit" }}
                        >
                          <EmailRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="caption" fontWeight={500} noWrap>
                            {inter.mail}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedId === `email-${inter.id}` ? "Copié !" : "Copier"}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleCopy(inter.mail!, `email-${inter.id}`, e)}
                            sx={{ p: 0.3 }}
                          >
                            <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}

                    {inter.phone && (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        p={0.6}
                        px={1}
                        borderRadius={1.5}
                        bgcolor="action.hover"
                      >
                        <Box
                          component="a"
                          href={`tel:${inter.phone}`}
                          display="flex"
                          alignItems="center"
                          gap={0.8}
                          sx={{ textDecoration: "none", color: "inherit" }}
                        >
                          <PhoneRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="caption" fontWeight={500} noWrap>
                            {inter.phone}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedId === `phone-${inter.id}` ? "Copié !" : "Copier"}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleCopy(inter.phone!, `phone-${inter.id}`, e)}
                            sx={{ p: 0.3 }}
                          >
                            <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}

                    {inter.linkedinProfile && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LinkedInIcon sx={{ color: "#0a66c2", fontSize: 16 }} />}
                        href={
                          inter.linkedinProfile.startsWith("http")
                            ? inter.linkedinProfile
                            : `https://${inter.linkedinProfile}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          mt: 0.5,
                          borderRadius: 1.5,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          py: 0.4,
                          borderColor: alpha("#0a66c2", 0.3),
                          color: "#0a66c2",
                        }}
                      >
                        Profil LinkedIn
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor.el}
        open={Boolean(menuAnchor.el)}
        onClose={() => setMenuAnchor({ el: null, interlocutor: null })}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 180 },
        }}
      >
        <MenuItem
          onClick={() =>
            menuAnchor.interlocutor && handleEditInterlocutor(menuAnchor.interlocutor)
          }
          sx={{ fontSize: "0.85rem", py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <EditRoundedIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText primary="Modifier le contact" />
        </MenuItem>
        <MenuItem
          onClick={() =>
            menuAnchor.interlocutor && handleDeleteInterlocutor(menuAnchor.interlocutor)
          }
          sx={{ fontSize: "0.85rem", py: 1, color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Supprimer" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default IndependentContactsView;

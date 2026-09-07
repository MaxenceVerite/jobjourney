import React, { useState } from "react";
import {
  Card,
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import Interlocutor from "../../models/opportunities/Interlocutor";
import { RootState } from "../../store/store";
import { deleteInterlocutor } from "../../store/slices/interlocutorSlice";
import { useModal } from "../../contexts/ModalContext";
import InterlocutorModal from "./InterlocutorModal";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";

interface InterlocutorCardProps {
  interlocutor: Interlocutor;
}

export const InterlocutorCard: React.FC<InterlocutorCardProps> = ({
  interlocutor,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const { openModal, closeModal } = useModal();

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const company = useSelector((state: RootState) =>
    state.companies.companies.find((c) => c.id === interlocutor.companyId)
  );

  const fullName = `${interlocutor.firstName} ${interlocutor.lastName}`.trim();
  const initials = `${interlocutor.firstName?.charAt(0) || ""}${
    interlocutor.lastName?.charAt(0) || ""
  }`.toUpperCase();

  const handleEdit = () => {
    setMenuAnchorEl(null);
    openModal(
      "Modifier le contact",
      <InterlocutorModal interlocutor={interlocutor} onClose={closeModal} />
    );
  };

  const handleDelete = () => {
    setMenuAnchorEl(null);
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} de vos contacts ?`)) {
      if (interlocutor.id) {
        dispatch(deleteInterlocutor({ id: interlocutor.id }));
      }
    }
  };

  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "rgba(0,0,0,0.08)",
        boxShadow: "0 4px 16px rgba(27, 44, 191, 0.04)",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 24px rgba(27, 44, 191, 0.08)",
          borderColor: alpha(theme.palette.primary.main, 0.25),
        },
      }}
    >
      <Box>
        {/* Header with Avatar, Name, Role & Menu */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.8}>
          <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: alpha(theme.palette.secondary.main, 0.15),
                color: "primary.main",
                fontWeight: 700,
                fontSize: "1.05rem",
                border: "1px solid",
                borderColor: alpha(theme.palette.secondary.main, 0.3),
              }}
            >
              {initials || "👤"}
            </Avatar>
            <Box minWidth={0}>
              <Typography
                variant="h6"
                fontWeight={700}
                color="text.primary"
                noWrap
                sx={{ fontSize: "1.05rem" }}
              >
                {fullName}
              </Typography>
              {interlocutor.role ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                  noWrap
                  sx={{ fontSize: "0.82rem" }}
                >
                  {interlocutor.role}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  Rôle non spécifié
                </Typography>
              )}
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            sx={{ color: "text.secondary" }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Company Affiliation Chip */}
        {company && (
          <Box mb={2}>
            <Chip
              icon={<BusinessRoundedIcon sx={{ fontSize: "14px !important" }} />}
              label={company.name}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.75rem",
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                color: "primary.main",
                borderColor: alpha(theme.palette.primary.main, 0.15),
              }}
            />
          </Box>
        )}

        {/* Direct Contact Links */}
        <Box display="flex" flexDirection="column" gap={1} mb={2}>
          {interlocutor.mail && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              p={0.8}
              px={1.2}
              borderRadius={1.5}
              bgcolor="action.hover"
              sx={{
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
              }}
            >
              <Box
                component="a"
                href={`mailto:${interlocutor.mail}`}
                display="flex"
                alignItems="center"
                gap={1}
                minWidth={0}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  "&:hover": { color: "primary.main" },
                }}
              >
                <EmailRoundedIcon fontSize="small" color="action" />
                <Typography variant="body2" fontSize="0.82rem" noWrap>
                  {interlocutor.mail}
                </Typography>
              </Box>
              <Tooltip title={copiedText === "email" ? "Copié !" : "Copier l'email"}>
                <IconButton
                  size="small"
                  onClick={(e) => handleCopy(interlocutor.mail!, "email", e)}
                  sx={{ p: 0.4 }}
                >
                  <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {interlocutor.phone && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              p={0.8}
              px={1.2}
              borderRadius={1.5}
              bgcolor="action.hover"
              sx={{
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
              }}
            >
              <Box
                component="a"
                href={`tel:${interlocutor.phone}`}
                display="flex"
                alignItems="center"
                gap={1}
                minWidth={0}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  "&:hover": { color: "primary.main" },
                }}
              >
                <PhoneRoundedIcon fontSize="small" color="action" />
                <Typography variant="body2" fontSize="0.82rem" noWrap>
                  {interlocutor.phone}
                </Typography>
              </Box>
              <Tooltip title={copiedText === "phone" ? "Copié !" : "Copier le numéro"}>
                <IconButton
                  size="small"
                  onClick={(e) => handleCopy(interlocutor.phone!, "phone", e)}
                  sx={{ p: 0.4 }}
                >
                  <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer / LinkedIn profile button */}
      <Box
        pt={1.5}
        borderTop="1px solid"
        borderColor="divider"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        {interlocutor.linkedinProfile ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<LinkedInIcon sx={{ color: "#0a66c2" }} />}
            href={
              interlocutor.linkedinProfile.startsWith("http")
                ? interlocutor.linkedinProfile
                : `https://${interlocutor.linkedinProfile}`
            }
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              py: 0.6,
              borderColor: alpha("#0a66c2", 0.3),
              "&:hover": { borderColor: "#0a66c2", bgcolor: alpha("#0a66c2", 0.04) },
            }}
          >
            Profil LinkedIn
          </Button>
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
            Pas de profil LinkedIn
          </Typography>
        )}
      </Box>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 180,
          },
        }}
      >
        <MenuItem onClick={handleEdit} sx={{ fontSize: "0.85rem", py: 1 }}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <EditRoundedIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText primary="Modifier" />
        </MenuItem>
        <MenuItem
          onClick={handleDelete}
          sx={{ fontSize: "0.85rem", py: 1, color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Supprimer" />
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default InterlocutorCard;

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
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Company from "../../models/opportunities/Company";
import { RootState } from "../../store/store";
import { deleteCompany } from "../../store/slices/companySlice";
import { useModal } from "../../contexts/ModalContext";
import CompanyModal from "./CompanyModal";
import CreateOpportunityForm from "../opportunities/CreateOpportunityForm";
import InterlocutorModal from "./InterlocutorModal";
import { getOpportunityStateLabel } from "../../helpers/opportunityFormatters";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const { openModal, closeModal } = useModal();

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const opportunities = useSelector((state: RootState) =>
    state.opportunities.opportunities.filter((o) => o.companyId === company.id)
  );

  const interlocutors = useSelector((state: RootState) =>
    state.interlocutors.interlocutors.filter((i) => i.companyId === company.id)
  );

  const activeOpportunities = opportunities.filter(
    (o) =>
      o.state !== "ARCHIVED" &&
      o.state !== "REFUSED" &&
      o.state !== "ABORTED"
  );

  const handleEdit = () => {
    setMenuAnchorEl(null);
    openModal(
      "Modifier l'entreprise",
      <CompanyModal company={company} onClose={closeModal} />
    );
  };

  const handleDelete = () => {
    setMenuAnchorEl(null);
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${company.name}" ?`)) {
      if (company.id) {
        dispatch(deleteCompany({ id: company.id }));
      }
    }
  };

  const handleAddOpportunity = () => {
    openModal(
      `Créer une opportunité - ${company.name}`,
      <CreateOpportunityForm
        onSubmit={closeModal}
        onClose={closeModal}
      />
    );
  };

  const handleAddContact = () => {
    openModal(
      `Nouveau contact chez ${company.name}`,
      <InterlocutorModal
        preselectedCompanyId={company.id}
        onClose={closeModal}
      />
    );
  };

  // Favicon helper
  const getFaviconUrl = (url?: string) => {
    if (!url) return null;
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
    } catch {
      return null;
    }
  };

  const favicon = getFaviconUrl(company.websiteUrl);

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
        {/* Header with Avatar, Name, and Menu */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
            <Avatar
              src={favicon || undefined}
              sx={{
                width: 44,
                height: 44,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
                fontWeight: 700,
                fontSize: "1.1rem",
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.15),
              }}
            >
              {company.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box minWidth={0}>
              <Typography
                variant="h6"
                fontWeight={700}
                color="text.primary"
                noWrap
                sx={{
                  fontSize: "1.05rem",
                  "&:hover": { color: "primary.main" },
                }}
              >
                {company.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                {company.websiteUrl && (
                  <Tooltip title="Ouvrir le site web">
                    <IconButton
                      size="small"
                      href={company.websiteUrl.startsWith("http") ? company.websiteUrl : `https://${company.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ p: 0.3, color: "text.secondary", "&:hover": { color: "primary.main" } }}
                    >
                      <LanguageRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {company.linkedinPageUrl && (
                  <Tooltip title="Ouvrir la page LinkedIn">
                    <IconButton
                      size="small"
                      href={company.linkedinPageUrl.startsWith("http") ? company.linkedinPageUrl : `https://${company.linkedinPageUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ p: 0.3, color: "#0a66c2", "&:hover": { opacity: 0.8 } }}
                    >
                      <LinkedInIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
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

        {/* Badges / Counters */}
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          <Chip
            icon={<WorkOutlineRoundedIcon sx={{ fontSize: "15px !important" }} />}
            label={`${opportunities.length} offre${opportunities.length > 1 ? "s" : ""}${
              activeOpportunities.length > 0 ? ` (${activeOpportunities.length} en cours)` : ""
            }`}
            size="small"
            sx={{
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor:
                activeOpportunities.length > 0
                  ? alpha(theme.palette.primary.main, 0.08)
                  : "action.hover",
              color: activeOpportunities.length > 0 ? "primary.main" : "text.secondary",
            }}
          />

          <Chip
            icon={<PeopleAltRoundedIcon sx={{ fontSize: "15px !important" }} />}
            label={`${interlocutors.length} contact${interlocutors.length > 1 ? "s" : ""}`}
            size="small"
            onClick={handleAddContact}
            sx={{
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
              color: "primary.main",
              cursor: "pointer",
            }}
          />
        </Box>

        {/* Opportunities list mini-preview */}
        {opportunities.length > 0 && (
          <Box mb={2} p={1.2} borderRadius={1.5} bgcolor={alpha(theme.palette.primary.main, 0.02)}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.8}>
              POSTES ASSOCIÉS :
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.6}>
              {opportunities.slice(0, 3).map((opp) => (
                <Box
                  key={opp.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    cursor: "pointer",
                    "&:hover": { color: "primary.main" },
                  }}
                  onClick={() => opp.id && navigate(`/opportunities/${opp.id}`)}
                >
                  <Typography variant="body2" fontSize="0.82rem" fontWeight={500} noWrap sx={{ maxWidth: "60%" }}>
                    {opp.roleTitle}
                  </Typography>
                  <Chip
                    label={getOpportunityStateLabel(opp.state)}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.68rem",
                      fontWeight: 600,
                    }}
                  />
                </Box>
              ))}
              {opportunities.length > 3 && (
                <Typography variant="caption" color="primary" fontWeight={600}>
                  +{opportunities.length - 3} autre(s)...
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer Actions */}
      <Box
        display="flex"
        gap={1}
        pt={1.5}
        borderTop="1px solid"
        borderColor="divider"
      >
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={handleAddOpportunity}
          sx={{
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.78rem",
            py: 0.6,
          }}
        >
          Nouvelle offre
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<PersonAddRoundedIcon />}
          onClick={handleAddContact}
          sx={{
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.78rem",
            py: 0.6,
          }}
        >
          Ajouter contact
        </Button>
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

export default CompanyCard;

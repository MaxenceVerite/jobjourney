import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
  Card,
  Typography,
  Box,
  Avatar,
  IconButton,
  Rating,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Opportunity, { EOpportunityState, EArchiveReason, RemoteCondition } from "../../../models/opportunities/Opportunity";
import { RootState } from "../../../store/store";
import { updateOpportunity } from "../../../store/slices/opportunitySlice";
import { useModal } from "../../../contexts/ModalContext";
import ArchiveOpportunityModal from "../ArchiveOpportunityModal";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import EuroRoundedIcon from "@mui/icons-material/EuroRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";

interface KanbanCardProps {
  opportunity: Opportunity;
  index: number;
}

const STAGE_LABELS: Record<EOpportunityState, string> = {
  [EOpportunityState.DRAFT]: "Brouillon / À postuler",
  [EOpportunityState.APPLIED]: "Candidature envoyée",
  [EOpportunityState.INTERVIEWING]: "Entretiens en cours",
  [EOpportunityState.NEGOCIATION_ON_OFFERS]: "Offres & Négociations",
  [EOpportunityState.VALIDATED]: "Offre validée",
  [EOpportunityState.REFUSED]: "Refusé",
  [EOpportunityState.ABORTED]: "Annulé",
  [EOpportunityState.ARCHIVED]: "Archivé",
};

const ARCHIVE_BADGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [EArchiveReason.ACCEPTED]: { label: "Offre acceptée", color: "#15803d", bg: "rgba(34, 197, 94, 0.12)" },
  [EArchiveReason.COMPANY_REJECTED]: { label: "Refus entreprise", color: "#b91c1c", bg: "rgba(239, 68, 68, 0.1)" },
  [EArchiveReason.USER_DECLINED]: { label: "Décliné (Candidat)", color: "#c2410c", bg: "rgba(245, 158, 11, 0.12)" },
  [EArchiveReason.GHOSTED]: { label: "Sans réponse", color: "#475569", bg: "rgba(100, 116, 139, 0.12)" },
  [EArchiveReason.POSITION_FROZEN]: { label: "Poste suspendu", color: "#6d28d9", bg: "rgba(139, 92, 246, 0.12)" },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ opportunity, index }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const { openModal, closeModal } = useModal();

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [opportunityCompany] = useSelector((state: RootState) =>
    state.companies.companies.filter((c) => c.id === opportunity.companyId)
  );

  const companyName = opportunityCompany?.name ?? "Entreprise";

  const isArchived =
    opportunity.state === EOpportunityState.ARCHIVED ||
    opportunity.state === EOpportunityState.REFUSED ||
    opportunity.state === EOpportunityState.ABORTED;

  const archiveBadge = opportunity.archiveReason
    ? ARCHIVE_BADGE_CONFIG[opportunity.archiveReason]
    : isArchived
    ? { label: "Archivé", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)" }
    : opportunity.state === EOpportunityState.VALIDATED
    ? ARCHIVE_BADGE_CONFIG[EArchiveReason.ACCEPTED]
    : null;

  const handleOpenArchiveModal = () => {
    setMenuAnchorEl(null);
    openModal(
      "Archiver / Clôturer l'opportunité",
      <ArchiveOpportunityModal
        opportunity={opportunity}
        onClose={closeModal}
      />
    );
  };

  const handleRatingChange = (event: any, newValue: number | null) => {
    event.stopPropagation();
    const updated = {
      ...opportunity,
      userAppreciationLevel: newValue || 0,
    };
    dispatch(updateOpportunity({ opportunity: updated }));
  };

  const handleMoveStage = (newState: EOpportunityState) => {
    setMenuAnchorEl(null);
    if (newState === opportunity.state) return;
    const updated = {
      ...opportunity,
      state: newState,
      lastUpdateDate: new Date(),
    };
    dispatch(updateOpportunity({ opportunity: updated }));
  };

  const nextInterview = opportunity.interviews && opportunity.interviews.length > 0
    ? [...opportunity.interviews].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
    : null;

  return (
    <Draggable draggableId={opportunity.id || `opp-${index}`} index={index}>
      {(provided, snapshot) => {
        const cardNode = (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => opportunity.id && navigate(`/opportunities/${opportunity.id}`)}
            sx={{
              mb: 2,
              p: 2.2,
              borderRadius: 2.5,
              cursor: "grab",
              position: "relative",
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: snapshot.isDragging ? theme.palette.primary.main : "rgba(0,0,0,0.06)",
              boxShadow: snapshot.isDragging
                ? `0 16px 32px ${alpha(theme.palette.primary.main, 0.25)}`
                : "0 4px 15px rgba(0,0,0,0.05)",
              transition: snapshot.isDragging ? "none" : "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
            }}
          >
            {/* Header with Avatar, Company & Menu */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
              <Box display="flex" alignItems="center" gap={1.2} minWidth={0}>
                <Avatar
                  src={opportunityCompany?.websiteUrl}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </Avatar>
                <Box minWidth={0}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="text.secondary"
                    noWrap
                    sx={{
                      fontSize: "0.82rem",
                      "&:hover": { color: "primary.main" },
                    }}
                    onClick={(e) => {
                      if (opportunity.companyId) {
                        e.stopPropagation();
                        navigate(`/sheets/companies/${opportunity.companyId}`);
                      }
                    }}
                  >
                    {companyName}
                  </Typography>
                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAnchorEl(e.currentTarget);
                }}
                sx={{ color: "text.secondary", p: 0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Role Title */}
            <Typography
              variant="h6"
              fontWeight={600}
              color="primary.main"
              mb={1}
              sx={{
                fontSize: "1.05rem",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {opportunity.roleTitle}
            </Typography>

            {/* Archive / Status Badge if applicable */}
            {archiveBadge && (
              <Box mb={1.2}>
                <Chip
                  label={archiveBadge.label}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    bgcolor: archiveBadge.bg,
                    color: archiveBadge.color,
                    border: `1px solid ${alpha(archiveBadge.color, 0.3)}`,
                  }}
                />
              </Box>
            )}

            {/* Tags (Remote Condition, Interviews, Salary) */}
            <Box display="flex" flexWrap="wrap" gap={0.8} mb={1.5}>
              {opportunity.remoteCondition && (
                <Chip
                  label={opportunity.remoteCondition}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    color: "primary.main",
                  }}
                />
              )}

              {opportunity.interviews && opportunity.interviews.length > 0 && (
                <Chip
                  icon={<EventAvailableRoundedIcon sx={{ fontSize: "14px !important" }} />}
                  label={`${opportunity.interviews.length} entretien${opportunity.interviews.length > 1 ? "s" : ""}`}
                  size="small"
                  color="secondary"
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                />
              )}

              {opportunity.indicativeSalaryRange?.min && (
                <Chip
                  icon={<EuroRoundedIcon sx={{ fontSize: "14px !important" }} />}
                  label={`${opportunity.indicativeSalaryRange.min}k${opportunity.indicativeSalaryRange.max ? ` - ${opportunity.indicativeSalaryRange.max}k` : ""}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    color: "success.dark",
                  }}
                />
              )}
            </Box>

            {/* Footer: Rating & Next interview date / Action button */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              pt={1.2}
              borderTop="1px solid"
              borderColor="divider"
            >
              <Rating
                size="small"
                value={opportunity.userAppreciationLevel || 0}
                onChange={handleRatingChange}
                sx={{
                  fontSize: "1.1rem",
                  "& .MuiRating-iconFilled": { color: theme.palette.success.main },
                }}
              />

              {nextInterview ? (
                <Tooltip title={`Prochain entretien : ${new Date(nextInterview.dueDate).toLocaleDateString()}`}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    📅 {new Date(nextInterview.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </Typography>
                </Tooltip>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  {new Date(opportunity.lastUpdateDate || opportunity.startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </Typography>
              )}
            </Box>

            {/* Stage Move Menu */}
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={() => setMenuAnchorEl(null)}
              onClick={(e) => e.stopPropagation()}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  minWidth: 220,
                },
              }}
            >
              <Typography variant="caption" sx={{ px: 2, py: 1, fontWeight: 700, color: "text.secondary", display: "block" }}>
                DÉPLACER VERS :
              </Typography>
              {Object.entries(STAGE_LABELS).map(([stateKey, label]) => (
                <MenuItem
                  key={stateKey}
                  selected={opportunity.state === stateKey}
                  onClick={() => handleMoveStage(stateKey as EOpportunityState)}
                  sx={{
                    fontSize: "0.85rem",
                    py: 1,
                    fontWeight: opportunity.state === stateKey ? 700 : 400,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <ArrowForwardRoundedIcon fontSize="small" color={opportunity.state === stateKey ? "primary" : "action"} />
                  </ListItemIcon>
                  <ListItemText primary={label} />
                </MenuItem>
              ))}

              <Box sx={{ my: 0.5, borderTop: "1px solid", borderColor: "divider" }} />

              <MenuItem
                onClick={handleOpenArchiveModal}
                sx={{
                  fontSize: "0.85rem",
                  py: 1,
                  color: isArchived ? "primary.main" : "text.secondary",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {isArchived ? (
                    <UnarchiveRoundedIcon fontSize="small" color="primary" />
                  ) : (
                    <ArchiveRoundedIcon fontSize="small" color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={isArchived ? "Gérer / Désarchiver" : "Archiver l'opportunité"}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </MenuItem>
            </Menu>
          </Card>
        );

        if (snapshot.isDragging) {
          return ReactDOM.createPortal(cardNode, document.body);
        }
        return cardNode;
      }}
    </Draggable>
  );
};

export default KanbanCard;

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Radio,
  Paper,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { useDispatch } from "react-redux";
import Opportunity, {
  EOpportunityState,
  EArchiveReason,
} from "../../models/opportunities/Opportunity";
import { updateOpportunity } from "../../store/slices/opportunitySlice";
import {
  getOpportunityStateLabel,
  getArchiveReasonLabel,
} from "../../helpers/opportunityFormatters";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

interface ArchiveOpportunityModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ReasonOption {
  key: EArchiveReason;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  state: EOpportunityState;
  suggestedTags: string[];
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    key: EArchiveReason.ACCEPTED,
    title: "Offre acceptée",
    subtitle: "Vous avez accepté la proposition et validé cette opportunité.",
    icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
    state: EOpportunityState.VALIDATED,
    suggestedTags: ["Offre signée", "Salaire validé", "Équipe confirmée", "Télétravail validé"],
  },
  {
    key: EArchiveReason.COMPANY_REJECTED,
    title: "Refusé par l'entreprise",
    subtitle: "L'entreprise a clôturé ou n'a pas retenu votre candidature.",
    icon: <HighlightOffRoundedIcon fontSize="small" />,
    state: EOpportunityState.REFUSED,
    suggestedTags: [
      "Après screening CV",
      "Après test technique",
      "Après entretien final",
      "Profil trop junior",
      "Profil trop senior",
      "Budget réduit",
    ],
  },
  {
    key: EArchiveReason.USER_DECLINED,
    title: "Refusé par moi (Candidat)",
    subtitle: "Vous avez décliné l'offre ou interrompu le processus de recrutement.",
    icon: <BlockRoundedIcon fontSize="small" />,
    state: EOpportunityState.REFUSED,
    suggestedTags: [
      "Autre offre préférée",
      "Salaire insuffisant",
      "Manque de télétravail",
      "Stack technique décevante",
      "Process trop long",
    ],
  },
  {
    key: EArchiveReason.GHOSTED,
    title: "Sans réponse / Ghosté",
    subtitle: "Aucun retour de l'entreprise malgré une ou plusieurs relances.",
    icon: <HourglassEmptyRoundedIcon fontSize="small" />,
    state: EOpportunityState.ABORTED,
    suggestedTags: ["Sans retour post-candidature", "Ghosté après 1er échange", "Relancé plusieurs fois"],
  },
  {
    key: EArchiveReason.POSITION_FROZEN,
    title: "Poste annulé ou gelé",
    subtitle: "L'entreprise a suspendu le recrutement ou annulé l'ouverture de poste.",
    icon: <PauseCircleOutlineRoundedIcon fontSize="small" />,
    state: EOpportunityState.ABORTED,
    suggestedTags: ["Gel des recrutements", "Changement de priorité", "Budget suspendu"],
  },
];

export const ArchiveOpportunityModal: React.FC<ArchiveOpportunityModalProps> = ({
  opportunity,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();

  const isAlreadyArchived =
    opportunity.state === EOpportunityState.ARCHIVED ||
    opportunity.state === EOpportunityState.REFUSED ||
    opportunity.state === EOpportunityState.ABORTED ||
    opportunity.state === EOpportunityState.VALIDATED;

  const [selectedReason, setSelectedReason] = useState<EArchiveReason>(
    (opportunity.archiveReason as EArchiveReason) || EArchiveReason.COMPANY_REJECTED
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState<string>(
    opportunity.archiveFeedback || ""
  );
  const [restoreState, setRestoreState] = useState<EOpportunityState>(
    EOpportunityState.APPLIED
  );

  const activeOption = REASON_OPTIONS.find((r) => r.key === selectedReason) || REASON_OPTIONS[0];

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirmArchive = () => {
    const combinedFeedback = [
      selectedTags.length > 0 ? `Tags: ${selectedTags.join(", ")}` : null,
      feedbackNotes.trim() ? feedbackNotes.trim() : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const updated: Opportunity = {
      ...opportunity,
      state: activeOption.state === EOpportunityState.VALIDATED ? EOpportunityState.VALIDATED : EOpportunityState.ARCHIVED,
      archiveReason: selectedReason,
      archiveFeedback: combinedFeedback,
      archivedDate: new Date(),
      lastUpdateDate: new Date(),
    };

    dispatch(updateOpportunity({ opportunity: updated }));
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleRestoreOpportunity = (targetState: EOpportunityState) => {
    const updated: Opportunity = {
      ...opportunity,
      state: targetState,
      archiveReason: undefined,
      archiveFeedback: undefined,
      archivedDate: undefined,
      lastUpdateDate: new Date(),
    };

    dispatch(updateOpportunity({ opportunity: updated }));
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", p: { xs: 1, sm: 2 } }}>
      {/* Target Opportunity Header Card */}
      <Box
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.12),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            {opportunity.roleTitle}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              Statut actuel :
            </Typography>
            <Chip
              label={getOpportunityStateLabel(opportunity.state)}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.72rem",
                fontWeight: 600,
                bgcolor: alpha(theme.palette.secondary.main, 0.12),
                color: "primary.main",
              }}
            />
          </Box>
        </Box>
        <Inventory2OutlinedIcon sx={{ color: "primary.main", opacity: 0.6, fontSize: 28 }} />
      </Box>

      {/* Restore Section if Already Archived */}
      {isAlreadyArchived && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.secondary.main, 0.05),
            border: "1px dashed",
            borderColor: alpha(theme.palette.secondary.main, 0.3),
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={0.8}>
            <RestoreRoundedIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
              Cette opportunité est actuellement clôturée
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={1.5} fontSize="0.85rem">
            Vous pouvez la restaurer dans votre pipeline actif :
          </Typography>

          <Box display="flex" gap={1.2} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleRestoreOpportunity(EOpportunityState.APPLIED)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 1.5,
                fontSize: "0.8rem",
              }}
            >
              Restaurer en "Candidature envoyée"
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleRestoreOpportunity(EOpportunityState.INTERVIEWING)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 1.5,
                fontSize: "0.8rem",
              }}
            >
              Restaurer en "Entretiens en cours"
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            OU METTRE À JOUR LE MOTIF D'ARCHIVAGE :
          </Typography>
        </Paper>
      )}

      {/* Choose Archive Reason */}
      <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={1.2}>
        1. Motif de clôture :
      </Typography>

      <Box display="flex" flexDirection="column" gap={1} mb={2.5}>
        {REASON_OPTIONS.map((opt) => {
          const isSelected = selectedReason === opt.key;
          return (
            <Paper
              key={opt.key}
              elevation={0}
              onClick={() => {
                setSelectedReason(opt.key);
                setSelectedTags([]);
              }}
              sx={{
                p: 1.5,
                borderRadius: 2,
                cursor: "pointer",
                border: "1px solid",
                borderColor: isSelected
                  ? "primary.main"
                  : "rgba(0, 0, 0, 0.08)",
                bgcolor: isSelected
                  ? alpha(theme.palette.primary.main, 0.04)
                  : "background.paper",
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: isSelected ? "primary.main" : alpha(theme.palette.primary.main, 0.3),
                  bgcolor: isSelected
                    ? alpha(theme.palette.primary.main, 0.06)
                    : alpha(theme.palette.primary.main, 0.02),
                },
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  color: isSelected ? "primary.main" : "text.secondary",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {opt.icon}
              </Box>
              <Box flexGrow={1} minWidth={0}>
                <Typography
                  variant="subtitle2"
                  fontWeight={isSelected ? 700 : 600}
                  color={isSelected ? "primary.main" : "text.primary"}
                  sx={{ fontSize: "0.9rem" }}
                >
                  {opt.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {opt.subtitle}
                </Typography>
              </Box>
              <Radio
                checked={isSelected}
                size="small"
                sx={{
                  color: "rgba(0, 0, 0, 0.2)",
                  "&.Mui-checked": { color: "primary.main" },
                  p: 0,
                }}
              />
            </Paper>
          );
        })}
      </Box>

      {/* Sub-reasons / Contextual Tags */}
      {activeOption.suggestedTags.length > 0 && (
        <Box mb={2.5}>
          <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={1}>
            2. Précisions (optionnel) :
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.8}>
            {activeOption.suggestedTags.map((tag) => {
              const isTagSelected = selectedTags.includes(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  clickable
                  onClick={() => handleToggleTag(tag)}
                  variant={isTagSelected ? "filled" : "outlined"}
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: 500,
                    fontSize: "0.78rem",
                    bgcolor: isTagSelected ? "primary.main" : "transparent",
                    color: isTagSelected ? "#fff" : "text.primary",
                    borderColor: isTagSelected ? "primary.main" : "divider",
                    "&:hover": {
                      bgcolor: isTagSelected ? "primary.dark" : alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Freeform Debrief Feedback & Learnings */}
      <Box mb={3}>
        <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={1}>
          3. Débriefing & retours d'expérience :
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Ex: Bon contact avec l'équipe, test technique à approfondir pour les prochains entretiens..."
          value={feedbackNotes}
          onChange={(e) => setFeedbackNotes(e.target.value)}
          size="small"
          sx={{
            "& .MuiInputBase-root": {
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            },
          }}
        />
      </Box>

      {/* Actions */}
      <Box display="flex" justifyContent="flex-end" gap={1.5} pt={1}>
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
          variant="contained"
          color="primary"
          onClick={handleConfirmArchive}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            boxShadow: "0 4px 12px rgba(27, 44, 191, 0.2)",
          }}
        >
          Confirmer l'archivage
        </Button>
      </Box>
    </Box>
  );
};

export default ArchiveOpportunityModal;

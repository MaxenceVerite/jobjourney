import {
  Grid,
  Typography,
  Button,
  TextareaAutosize,
  TextField,
  Container,
  Box,
  Chip,
  Alert,
  AlertTitle,
  useTheme,
  alpha,
  Paper,
  Divider,
  Skeleton,
  Collapse,
  CircularProgress,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  Article as ArticleIcon,
  AutoAwesome as AutoAwesomeIcon,
  Link,
  RefreshRounded as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import Opportunity, {
  EOpportunityState,
} from "../../models/opportunities/Opportunity";
import {
  getOpportunity,
  updateOpportunity,
  updateOpportunityDocuments,
} from "../../store/slices/opportunitySlice";
import { generateOpportunitySummary } from "../../api/myJobBoard/features/opportunities/opportunitiesApi";
import { useTranslation } from "react-i18next";
import { fetchDocuments } from "../../store/slices/documentSlice";
import ActionableSection from "../../components/common/ActionableSection";
import DocumentCardList from "../../components/documents/DocumentCardList";
import { useModal } from "../../contexts/ModalContext";
import DocumentPicker from "../../components/documents/forms/DocumentPicker";
import OpportunityInterviewCardList from "../../components/opportunities/interviews/OpportunityInterviewCardList";
import PhaseStepper from "../../components/common/inputs/PhaseStepper";
import ArchiveOpportunityModal from "../../components/opportunities/ArchiveOpportunityModal";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";
import {
  getOpportunityStateLabel,
  getArchiveReasonLabel,
} from "../../helpers/opportunityFormatters";

const OpportunityDetailContent = () => {
  const { id } = useParams();

  const dispatch = useDispatch<any>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    if (id) {
      dispatch(getOpportunity({ id }));
    }
  }, [id, dispatch]);

  const opportunity = useSelector(
    (state: RootState) => state.opportunities.currentOpportunity
  );

  useEffect(() => {
    if (opportunity?.documents) {
      dispatch(fetchDocuments());
    }
  }, [opportunity, dispatch]);

  const opportunityCompany = useSelector((state: RootState) =>
    state.companies.companies.find((c) => c.id == opportunity?.companyId)
  );

  const opportunityDocuments = useSelector((state: RootState) => {
    return state.documents.documents.filter(q => opportunity?.documents?.map(d => d.id).includes(q.id))
  });

  const companyName = opportunityCompany?.name ?? "Entreprise inconnue";

  const handleJoinedDocumentsChange = (selectedDocumentIds: string[]) => {
    dispatch(updateOpportunityDocuments({ opportunityId: opportunity?.id!, documentsIds: selectedDocumentIds }));
    closeModal();
  };

  const handleJoinDocument = () => {
    openModal(
      "Sélectionner un document",
      <DocumentPicker
        preselectedDocumentIds={opportunity?.documents?.map(c => c.id)}
        multipleSelection
        notifyOnCommit
        onSelectionChange={handleJoinedDocumentsChange}
      />
    );
  };

  const [note, setNote] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (opportunity?.aiSummary) setSummary(opportunity.aiSummary);
  }, [opportunity?.aiSummary]);

  useEffect(() => {
    if (opportunity?.freeNotes) {
      setNote(opportunity.freeNotes);
    }
  }, [opportunity?.freeNotes]);

  const saveOpportunityNotes = () => {
    if (opportunity?.freeNotes !== note) {
      dispatch(
        updateOpportunity({
          opportunity: { ...opportunity!, freeNotes: note },
        })
      );
    }
  };

  const theme = useTheme();

  if (!opportunity || !id) {
    return null;
  }

  const isArchived =
    opportunity.state === EOpportunityState.ARCHIVED ||
    opportunity.state === EOpportunityState.REFUSED ||
    opportunity.state === EOpportunityState.ABORTED;

  const handleOpenArchiveModal = () => {
    openModal(
      "Archiver / Clôturer l'opportunité",
      <ArchiveOpportunityModal
        opportunity={opportunity}
        onClose={closeModal}
        onSuccess={() => {
          if (id) dispatch(getOpportunity({ id }));
        }}
      />
    );
  };

  const handleGenerateSummary = async () => {
    if (!id) return;
    setSummaryLoading(true);
    setSummaryOpen(true);
    try {
      const result = await generateOpportunitySummary(id);
      setSummary(result);
      // Refresh the opportunity in Redux store so aiSummary is persisted locally too
      dispatch(getOpportunity({ id }));
    } catch (err: any) {
      setSummary(`> **Erreur lors de la génération.** ${err?.response?.data?.message ?? "Veuillez réessayer."}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Archive Notice Banner */}
      {(isArchived || opportunity.archiveReason) && (
        <Box mb={4}>
          <Alert
            severity={opportunity.state === EOpportunityState.VALIDATED ? "success" : "info"}
            icon={isArchived ? <ArchiveRoundedIcon /> : undefined}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleOpenArchiveModal}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Gérer / Restaurer
              </Button>
            }
            sx={{
              borderRadius: 2.5,
              alignItems: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            }}
          >
            <AlertTitle sx={{ fontWeight: 700, mb: 0.3 }}>
              {opportunity.state === EOpportunityState.VALIDATED
                ? "Offre validée et acceptée"
                : `Opportunité clôturée • ${getArchiveReasonLabel(opportunity.archiveReason) || getOpportunityStateLabel(opportunity.state)}`}
            </AlertTitle>
            {opportunity.archiveFeedback && (
              <Typography variant="body2" sx={{ whiteSpace: "pre-line", opacity: 0.9 }}>
                {opportunity.archiveFeedback}
              </Typography>
            )}
          </Alert>
        </Box>
      )}

      {/* Header Section */}
      <Box mb={{xs: 3, md: 5}}>
        <Grid container alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography
              noWrap
              fontWeight={600}
              variant="h6"
              color="text.secondary"
              sx={{
                fontSize: "1rem",
                "&:hover": {
                  color: "primary.main",
                  cursor: "pointer",
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (opportunity.companyId) {
                  navigate(`/sheets/companies/${opportunity.companyId}`);
                }
              }}
            >
              {companyName}
            </Typography>

            <Typography
              fontWeight={800}
              variant="h3"
              color="primary.main"
              sx={{ mt: 0.5, letterSpacing: "-0.5px", fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
            >
              {opportunity.roleTitle}
            </Typography>

            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<Link />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Lien de l'offre
              </Button>
              {opportunity.remoteCondition && (
                <Chip
                  label={t(`RemoteCondition.${opportunity.remoteCondition}`)}
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 600, borderRadius: 1.5 }}
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4} display="flex" flexDirection={{xs: "column", sm: "row"}} justifyContent={{ xs: "stretch", md: "flex-end" }} gap={1.5}>
            <Button
              variant="contained"
              color={isArchived ? "primary" : "inherit"}
              disableElevation
              fullWidth
              startIcon={isArchived ? <UnarchiveRoundedIcon /> : <ArchiveRoundedIcon />}
              onClick={handleOpenArchiveModal}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: isArchived ? "primary.main" : "background.paper",
                color: isArchived ? "white" : "text.primary",
                boxShadow: isArchived ? "0 4px 12px rgba(27,44,191,0.2)" : "0 2px 8px rgba(0,0,0,0.08)",
                "&:hover": { bgcolor: isArchived ? "primary.dark" : "grey.100" }
              }}
            >
              {isArchived ? "Gérer l'archivage" : "Archiver"}
            </Button>

            <Button
              color="info"
              variant={summaryOpen ? "contained" : "text"}
              fullWidth
              startIcon={summaryLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={() => {
                if (summary && !summaryLoading) {
                  setSummaryOpen((prev) => !prev);
                } else {
                  handleGenerateSummary();
                }
              }}
              sx={{ textTransform: "none", fontWeight: 600, bgcolor: summaryOpen ? undefined : {xs: alpha(theme.palette.info.main, 0.1), sm: "transparent"} }}
            >
              {summaryLoading ? "Génération..." : summary ? (summaryOpen ? "Masquer le résumé" : "Voir le résumé IA") : "Générer un résumé IA"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* AI Summary Panel */}
      <Collapse in={summaryOpen} unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            mb: { xs: 3, md: 4 },
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            bgcolor: alpha(theme.palette.info.main, 0.04),
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "4px",
              height: "100%",
              bgcolor: "info.main",
              borderRadius: "3px 0 0 3px",
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AutoAwesomeIcon color="info" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700} color="info.main">
              Résumé stratégique IA
            </Typography>
            <Box flexGrow={1} />
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              sx={{ textTransform: "none", fontSize: "0.78rem" }}
            >
              Regénérer
            </Button>
          </Box>

          {summaryLoading ? (
            <Box>
              <Skeleton variant="text" width="80%" height={24} />
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="90%" height={24} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="85%" height={24} />
            </Box>
          ) : (
            <Box
              sx={{
                "& h2": { fontSize: "1rem", fontWeight: 700, mt: 2, mb: 0.5, color: "text.primary" },
                "& h3": { fontSize: "0.9rem", fontWeight: 600, mt: 1.5, mb: 0.5 },
                "& ul": { pl: 2.5, mb: 1 },
                "& li": { mb: 0.3, fontSize: "0.9rem" },
                "& p": { mb: 1, fontSize: "0.9rem", lineHeight: 1.6 },
                "& strong": { fontWeight: 700 },
                "& blockquote": {
                  borderLeft: `3px solid ${theme.palette.info.main}`,
                  pl: 2,
                  ml: 0,
                  color: "text.secondary",
                  fontStyle: "italic",
                },
              }}
              dangerouslySetInnerHTML={{
                __html: summary
                  ? summary
                    // Headers
                    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                    // Bold
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    // Italic
                    .replace(/\*(.+?)\*/g, "<em>$1</em>")
                    // Unordered lists
                    .replace(/^- (.+)$/gm, "<li>$1</li>")
                    .replace(/(<li>.*<\/li>\n?)+/gs, (m) => `<ul>${m}</ul>`)
                    // Blockquote
                    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
                    // Paragraphs (double newline)
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/^(?!<[hul])(.+)$/gm, (m) => m.startsWith("<") ? m : `<p>${m}</p>`)
                  : "",
              }}
            />
          )}
        </Paper>
      </Collapse>

      {/* Stepper Section */}
      <Paper elevation={0} sx={{ p: {xs: 1.5, sm: 3}, mb: {xs: 3, md: 4}, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", overflowX: "auto" }}>
        <PhaseStepper currentPhase={opportunity.state} />
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={4}>
        {/* Left Column (Notes, Offres) */}
        <Grid item xs={12} md={7}>
          <Box mb={4}>
            <ActionableSection sectionTitle="Notes" isExpanded>
              <TextareaAutosize
                minRows={8}
                placeholder="Écrivez vos notes, impressions, détails de l'offre ici..."
                style={{
                  width: "100%",
                  resize: "vertical",
                  padding: "16px",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  borderRadius: "12px",
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  color: theme.palette.text.primary,
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.palette.primary.main;
                  e.target.style.boxShadow = `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = alpha(theme.palette.divider, 0.8);
                  e.target.style.boxShadow = "none";
                  saveOpportunityNotes();
                }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </ActionableSection>
          </Box>

          <Box>
            <ActionableSection sectionTitle="Offres" isExpanded>
              <TextareaAutosize
                minRows={6}
                placeholder="Détails de l'offre reçue (salaire, avantages...)"
                style={{
                  width: "100%",
                  resize: "vertical",
                  padding: "16px",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  borderRadius: "12px",
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  color: theme.palette.text.primary,
                  outline: "none",
                }}
              />
            </ActionableSection>
          </Box>
        </Grid>

        {/* Right Column (Interviews, Documents) */}
        <Grid item xs={12} md={5}>
          <Box mb={4}>
            <OpportunityInterviewCardList
              opportunityId={opportunity.id!}
              interviews={opportunity.interviews}
              isExpanded
            />
          </Box>
          <Box>
            <DocumentCardList
              customAddDocument={handleJoinDocument}
              title="Documents liés"
              documents={opportunityDocuments}
              isExpanded
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OpportunityDetailContent;

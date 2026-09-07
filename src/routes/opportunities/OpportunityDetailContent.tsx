import {
  Grid,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
  TextareaAutosize,
  TextField,
  Container,
  Box,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  Article as ArticleIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  EmojiPeopleOutlined,
  Link,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import Opportunity, {
  EOpportunityState,
} from "../../models/opportunities/Opportunity";
import { useDispatch } from "react-redux";
import {
  getOpportunity,
  updateOpportunity,
  updateOpportunityDocuments,
} from "../../store/slices/opportunitySlice";
import { useTranslation } from "react-i18next";
import ApplicationContainer from "../../components/application/ApplicationContainer";
import { fetchDocuments } from "../../store/slices/documentSlice";
import ActionableSection from "../../components/common/ActionableSection";
import ExpendableTextfield from "../../components/common/inputs/ExpendableTextfield";
import DocumentCardList from "../../components/documents/DocumentCardList";
import { useModal } from "../../contexts/ModalContext";
import DocumentPicker from "../../components/documents/forms/DocumentPicker";
import OpportunityInterviewCard from "../../components/opportunities/interviews/OpportunityInterviewCard";
import OpportunityInterviewCardList from "../../components/opportunities/interviews/OpportunityInterviewCardList";
import PhaseStepper from "../../components/common/inputs/PhaseStepper";
import ArchiveOpportunityModal from "../../components/opportunities/ArchiveOpportunityModal";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";
import { Chip, Alert, AlertTitle, useTheme, alpha } from "@mui/material";
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


  const activeStep = EOpportunityState.APPLIED;

  const phases: EOpportunityState[] = useSelector(
    (state: RootState) => state.opportunities.opportunityStates
  );
  const [opportunityCompany] = useSelector((state: RootState) =>
    state.companies.companies.filter((c) => c.id == opportunity!.companyId)
  );

  const opportunityDocuments = useSelector((state: RootState) => {
    return state.documents.documents.filter(q => opportunity?.documents?.map(d => d.id).includes(q.id))
  })

  const companyName = opportunityCompany?.name ?? "Enseigne";

  const handleJoinedDocumentsChange = (selectedDocumentIds: string[]) => {
   

    dispatch(updateOpportunityDocuments({opportunityId: opportunity?.id!, documentsIds: selectedDocumentIds }));
    closeModal();
  };

  const handleJoinDocument = () => {
    openModal(
      "Selectionner un document",
      <DocumentPicker
        preselectedDocumentIds={opportunity?.documents?.map(c => c.id)}
        multipleSelection
        notifyOnCommit
        onSelectionChange={handleJoinedDocumentsChange}
      />
    );
  };

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
  const [note, setNote] = useState(opportunity?.freeNotes || "");

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

  return (
    <Grid container xs={12}>
      {/* Archive Notice Banner if Archived */}
      {(isArchived || opportunity.archiveReason) && (
        <Grid item xs={12} mb={3}>
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
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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
        </Grid>
      )}

      <Grid container xs={12} mb={4} alignItems="center" justifyContent="space-between">
        <Grid item xs={12} sm={7}>
          <Typography
            noWrap
            fontWeight={600}
            variant="h5"
            color="secondary.main"
            sx={{
              "&:hover": {
                textDecoration: "underline",
                cursor: "pointer",
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              opportunity.companyId
                ? navigate(`/sheets/companies/${opportunity.companyId}`)
                : undefined;
            }}
          >
            {companyName}
          </Typography>

          <Typography
            noWrap
            fontWeight={700}
            variant="h4"
            color="primary.main"
            sx={{ mt: 0.5 }}
          >
            {opportunity.roleTitle}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={5} display="flex" justifyContent={{ xs: "flex-start", sm: "flex-end" }} gap={1.5} mt={{ xs: 2, sm: 0 }}>
          <Button
            variant="outlined"
            color={isArchived ? "primary" : "inherit"}
            startIcon={isArchived ? <UnarchiveRoundedIcon /> : <ArchiveRoundedIcon />}
            onClick={handleOpenArchiveModal}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {isArchived ? "Gérer l'archivage" : "Archiver l'offre"}
          </Button>

          <Button color="info" variant="text" startIcon={<ArticleIcon />} sx={{ textTransform: "none", fontWeight: 600 }}>
            Voir le résumé
          </Button>
        </Grid>
      </Grid>

      <Grid container xs={12} mb={4}>
        <Grid item xs={6}>
          <Button
            size="small"
            color="primary"
            variant="text"
            startIcon={<Link />}
          >
            Lien vers l'offre
          </Button>
        </Grid>
      </Grid>

      <Box width="100%" mb={5}>
      <PhaseStepper currentPhase={opportunity.state} />
      </Box>
      <ActionableSection  sectionTitle="Notes" isExpanded>
        <TextareaAutosize
          minRows={6}
          style={{
            width: "100%",
            resize: "vertical",
            padding: 10,
            fontSize: "1rem",
            borderColor: "0",
            border: "0",
            boxShadow: "5px 10px 15px rgba(0,0,0,0.07)",
            outline: "none",
            marginTop: "2%",
            marginBottom: "2%"
          }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveOpportunityNotes}
        />
      </ActionableSection>

      <DocumentCardList
        customAddDocument={handleJoinDocument}
        title="Documents envoyés"
        documents={opportunityDocuments}
        isExpanded
      />

      <OpportunityInterviewCardList
        opportunityId={opportunity.id!}
        interviews={opportunity.interviews}
        isExpanded
      />

      <ActionableSection sectionTitle="Offres" isExpanded>
        <TextareaAutosize
          minRows={6}
          style={{
            width: "100%",
            resize: "vertical",
            padding: 10,
            fontSize: "1rem",
            borderColor: "0",
            border: "0",
            boxShadow: "5px 10px 15px rgba(0,0,0,0.07)",
            outline: "none",
          }}
        />
      </ActionableSection>

      <Grid md={1}></Grid>
      <Grid xs={12} md={4} mb="3%"></Grid>
      <Grid xs={12}></Grid>
      <Grid xs={12}></Grid>
      <Grid xs={12}></Grid>
    </Grid>
  );
};

export default OpportunityDetailContent;

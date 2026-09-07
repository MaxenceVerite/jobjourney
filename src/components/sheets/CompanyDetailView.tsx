import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Chip,
  Grid,
  Paper,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Company from "../../models/opportunities/Company";
import Interlocutor from "../../models/opportunities/Interlocutor";
import Opportunity from "../../models/opportunities/Opportunity";
import { RootState } from "../../store/store";
import { updateCompany, deleteCompany } from "../../store/slices/companySlice";
import { enqueueNotification } from "../../store/slices/notificationSlice";
import { deleteInterlocutor } from "../../store/slices/interlocutorSlice";
import { useModal } from "../../contexts/ModalContext";
import CompanyModal from "./CompanyModal";
import InterlocutorModal from "./InterlocutorModal";
import CreateOpportunityForm from "../opportunities/CreateOpportunityForm";
import { getOpportunityStateLabel } from "../../helpers/opportunityFormatters";

import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import EuroRoundedIcon from "@mui/icons-material/EuroRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";

interface CompanyDetailViewProps {
  company: Company;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({
  company,
  onBack,
  showBackButton = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const { openModal, closeModal } = useModal();

  const [companyMenuAnchor, setCompanyMenuAnchor] = useState<null | HTMLElement>(null);
  const [interlocutorMenuAnchor, setInterlocutorMenuAnchor] = useState<{
    el: HTMLElement | null;
    interlocutor: Interlocutor | null;
  }>({ el: null, interlocutor: null });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const opportunities = useSelector((state: RootState) =>
    state.opportunities.opportunities.filter((o) => o.companyId === company.id)
  );

  const interlocutors = useSelector((state: RootState) =>
    state.interlocutors.interlocutors.filter((i) => i.companyId === company.id)
  );

  const handleEnrichAi = async () => {
    setCompanyMenuAnchor(null);
    setIsGenerating(true);
    try {
      const { generateCompanySummary } = await import("../../services/companyService");
      const result = await generateCompanySummary(company.name);
      if (result) {
        const safelyStringify = (val: any) => {
          if (!val) return undefined;
          if (typeof val === 'string') return val;
          if (Array.isArray(val)) return "- " + val.join("\n- ");
          if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join("\n");
          return String(val);
        };

        const payload: Company = {
          ...company,
          pitch: safelyStringify(result.pitch || result.Pitch) || company.pitch,
          competitors: safelyStringify(result.competitors || result.Competitors) || company.competitors,
          culture: safelyStringify(result.culture || result.Culture) || company.culture,
          interviewTips: safelyStringify(result.interviewtips || result.InterviewTips || result.interviewTips) || company.interviewTips,
        };
        await dispatch(updateCompany({ company: payload })).unwrap();
      }
    } catch (err: any) {
      console.error("Erreur d'enrichissement", err);
      let errorMsg = "Une erreur est survenue lors de la génération du dossier.";
      if (err.response?.status === 503 || err.message?.includes("503")) {
        errorMsg = "L'IA est actuellement surchargée. Veuillez réessayer dans quelques instants.";
      } else if (err.response?.status === 429 || err.message?.includes("429")) {
        errorMsg = "Vous avez atteint votre limite de génération d'IA pour aujourd'hui.";
      }
      dispatch(enqueueNotification({
        message: errorMsg,
        severity: "error",
        duration: 6000,
        key: new Date().getTime().toString()
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditCompany = () => {
    setCompanyMenuAnchor(null);
    openModal(
      "Modifier l'entreprise",
      <CompanyModal company={company} onClose={closeModal} />
    );
  };

  const handleDeleteCompany = () => {
    setCompanyMenuAnchor(null);
    if (window.confirm(`Supprimer l'entreprise "${company.name}" et ses liaisons ?`)) {
      if (company.id) {
        dispatch(deleteCompany({ id: company.id }));
      }
    }
  };

  const handleAddInterlocutor = () => {
    openModal(
      `Ajouter un contact chez ${company.name}`,
      <InterlocutorModal
        preselectedCompanyId={company.id}
        onClose={closeModal}
      />
    );
  };

  const handleEditInterlocutor = (inter: Interlocutor) => {
    setInterlocutorMenuAnchor({ el: null, interlocutor: null });
    openModal(
      "Modifier le contact",
      <InterlocutorModal interlocutor={inter} onClose={closeModal} />
    );
  };

  const handleDeleteInterlocutor = (inter: Interlocutor) => {
    setInterlocutorMenuAnchor({ el: null, interlocutor: null });
    if (window.confirm(`Supprimer le contact ${inter.firstName} ${inter.lastName} ?`)) {
      if (inter.id) {
        dispatch(deleteInterlocutor({ id: inter.id }));
      }
    }
  };

  const handleAddOpportunity = () => {
    openModal(
      `Créer une opportunité chez ${company.name}`,
      <CreateOpportunityForm
        onSubmit={closeModal}
        onClose={closeModal}
      />
    );
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFaviconUrl = (url?: string) => {
    if (!url) return null;
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`;
    } catch {
      return null;
    }
  };

  const favicon = getFaviconUrl(company.websiteUrl);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Mobile Back Button */}
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

      {/* 360 Header Card */}
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
        }}
      >
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2.5} minWidth={0}>
            <Avatar
              src={favicon || undefined}
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
                fontWeight: 700,
                fontSize: "1.6rem",
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.15),
              }}
            >
              {company.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box minWidth={0}>
              <Typography variant="h4" fontWeight={700} color="primary.main" noWrap>
                {company.name}
              </Typography>

              {/* Action buttons & External links */}
              <Box display="flex" alignItems="center" gap={1.2} mt={1} flexWrap="wrap">
                {company.websiteUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<LanguageRoundedIcon fontSize="small" />}
                    href={
                      company.websiteUrl.startsWith("http")
                        ? company.websiteUrl
                        : `https://${company.websiteUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      py: 0.4,
                      px: 1.2,
                      borderColor: "rgba(0,0,0,0.15)",
                      color: "text.primary",
                      "&:hover": { borderColor: "primary.main", color: "primary.main" },
                    }}
                  >
                    Site Web
                  </Button>
                )}

                {company.linkedinPageUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<LinkedInIcon fontSize="small" sx={{ color: "#0a66c2" }} />}
                    href={
                      company.linkedinPageUrl.startsWith("http")
                        ? company.linkedinPageUrl
                        : `https://${company.linkedinPageUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      py: 0.4,
                      px: 1.2,
                      borderColor: alpha("#0a66c2", 0.3),
                      color: "#0a66c2",
                      "&:hover": { borderColor: "#0a66c2", bgcolor: alpha("#0a66c2", 0.04) },
                    }}
                  >
                    LinkedIn
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Company Menu */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              size="small"
              onClick={(e) => setCompanyMenuAnchor(e.currentTarget)}
              sx={{ color: "text.secondary" }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Company Quick Counters */}
        <Box display="flex" gap={1.5} mt={3} pt={2.5} borderTop="1px solid" borderColor="divider">
          <Chip
            icon={<PeopleAltRoundedIcon sx={{ fontSize: "16px !important" }} />}
            label={`${interlocutors.length} contact${interlocutors.length > 1 ? "s" : ""}`}
            sx={{
              fontWeight: 600,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: "primary.main",
            }}
          />
          <Chip
            icon={<WorkOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
            label={`${opportunities.length} offre${opportunities.length > 1 ? "s" : ""} liée${opportunities.length > 1 ? "s" : ""}`}
            sx={{
              fontWeight: 600,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: "primary.main",
            }}
          />
        </Box>
      </Paper>

      {/* AI ENRICHMENT SECTION */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <BusinessCenterRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Dossier de Préparation
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            disabled={isGenerating}
            onClick={handleEnrichAi}
            startIcon={<AutoAwesomeRoundedIcon />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {isGenerating ? "Recherche en cours..." : "Enrichir avec l'IA"}
          </Button>
        </Box>
        
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: "background.paper",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {company.pitch || company.industry || company.address ? (
            <Grid container spacing={3}>
              {(company.industry || company.address || company.employeeCount) && (
                <Grid item xs={12}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {company.industry && <Chip size="small" label={company.industry} color="primary" variant="outlined" />}
                    {company.employeeCount && <Chip size="small" label={`Effectifs: ${company.employeeCount}`} />}
                    {company.address && <Chip size="small" label={company.address} icon={<InfoOutlinedIcon />} />}
                  </Box>
                </Grid>
              )}
              {company.pitch && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={700} mb={0.5}>Pitch & Activité</Typography>
                  <Typography variant="body2" color="text.secondary">{company.pitch}</Typography>
                </Grid>
              )}
              {company.culture && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={700} mb={0.5}>Culture d'Entreprise</Typography>
                  <Typography variant="body2" color="text.secondary">{company.culture}</Typography>
                </Grid>
              )}
              {company.competitors && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={700} mb={0.5}>Marché & Concurrents</Typography>
                  <Typography variant="body2" color="text.secondary">{company.competitors}</Typography>
                </Grid>
              )}
              {company.interviewTips && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="secondary.main" fontWeight={700} mb={0.5}>💡 Conseils pour l'entretien</Typography>
                  <Typography variant="body2" color="text.secondary">{company.interviewTips}</Typography>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                Le dossier de préparation est vide. Laissez l'IA faire les recherches pour vous !
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                disabled={isGenerating}
                onClick={handleEnrichAi}
                startIcon={<AutoAwesomeRoundedIcon />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                {isGenerating ? "Recherche en cours..." : "Générer le dossier complet"}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* SECTION 1: 👥 INTERLOCUTEURS CHEZ CETTE ENTREPRISE */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PeopleAltRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Interlocuteurs & Contacts ({interlocutors.length})
            </Typography>
          </Box>

          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<PersonAddRoundedIcon />}
            onClick={handleAddInterlocutor}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            Ajouter un contact
          </Button>
        </Box>

        {interlocutors.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 2.5,
              bgcolor: "background.paper",
              border: "1px dashed rgba(0,0,0,0.12)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Vous n'avez pas encore ajouté d'interlocuteurs pour {company.name}.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PersonAddRoundedIcon />}
              onClick={handleAddInterlocutor}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Ajouter un recruteur ou manager
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
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        boxShadow: "0 4px 16px rgba(27, 44, 191, 0.06)",
                      },
                    }}
                  >
                    {/* Header: Avatar, Name, Role & Menu */}
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                      <Box display="flex" alignItems="center" gap={1.2} minWidth={0}>
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
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                            {fullName}
                          </Typography>
                          {inter.role ? (
                            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">
                              {inter.role}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.disabled" fontStyle="italic">
                              Rôle non spécifié
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) =>
                          setInterlocutorMenuAnchor({
                            el: e.currentTarget,
                            interlocutor: inter,
                          })
                        }
                        sx={{ color: "text.secondary", p: 0.5 }}
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
                            minWidth={0}
                            sx={{
                              textDecoration: "none",
                              color: "inherit",
                              "&:hover": { color: "primary.main" },
                            }}
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
                            minWidth={0}
                            sx={{
                              textDecoration: "none",
                              color: "inherit",
                              "&:hover": { color: "primary.main" },
                            }}
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
      </Box>

      {/* SECTION 2: 💼 CANDIDATURES & OFFRES CHEZ CETTE ENTREPRISE */}
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <WorkOutlineRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Candidatures & Opportunités ({opportunities.length})
            </Typography>
          </Box>

          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<AddRoundedIcon />}
            onClick={handleAddOpportunity}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            Nouvelle offre
          </Button>
        </Box>

        {opportunities.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 2.5,
              bgcolor: "background.paper",
              border: "1px dashed rgba(0,0,0,0.12)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Aucune opportunité enregistrée pour cette entreprise.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddRoundedIcon />}
              onClick={handleAddOpportunity}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Créer une première candidature
            </Button>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {opportunities.map((opp) => (
              <Paper
                key={opp.id}
                elevation={0}
                onClick={() => opp.id && navigate(`/opportunities/${opp.id}`)}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                  border: "1px solid rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    boxShadow: "0 4px 16px rgba(27, 44, 191, 0.08)",
                    transform: "translateX(4px)",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1.2} mb={0.5}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main" noWrap>
                      {opp.roleTitle}
                    </Typography>
                    <Chip
                      label={getOpportunityStateLabel(opp.state)}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: "primary.main",
                      }}
                    />
                  </Box>

                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    {opp.remoteCondition && (
                      <Typography variant="caption" color="text.secondary">
                        📍 {opp.remoteCondition}
                      </Typography>
                    )}
                    {opp.indicativeSalaryRange?.min && (
                      <Typography variant="caption" color="text.secondary">
                        💶 {opp.indicativeSalaryRange.min}k{opp.indicativeSalaryRange.max ? ` - ${opp.indicativeSalaryRange.max}k` : ""}
                      </Typography>
                    )}
                    {opp.interviews && opp.interviews.length > 0 && (
                      <Typography variant="caption" color="primary" fontWeight={600}>
                        📅 {opp.interviews.length} entretien{opp.interviews.length > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <IconButton size="small" sx={{ color: "primary.main" }}>
                  <ArrowForwardRoundedIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Company Action Menu */}
      <Menu
        anchorEl={companyMenuAnchor}
        open={Boolean(companyMenuAnchor)}
        onClose={() => setCompanyMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 180,
          },
        }}
      >
        <MenuItem onClick={handleEditCompany} sx={{ fontSize: "0.85rem", py: 1 }}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <EditRoundedIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText primary="Modifier l'entreprise" />
        </MenuItem>
        <MenuItem
          onClick={handleDeleteCompany}
          sx={{ fontSize: "0.85rem", py: 1, color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Supprimer" />
        </MenuItem>
      </Menu>

      {/* Interlocutor Action Menu */}
      <Menu
        anchorEl={interlocutorMenuAnchor.el}
        open={Boolean(interlocutorMenuAnchor.el)}
        onClose={() => setInterlocutorMenuAnchor({ el: null, interlocutor: null })}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 180,
          },
        }}
      >
        <MenuItem
          onClick={() =>
            interlocutorMenuAnchor.interlocutor &&
            handleEditInterlocutor(interlocutorMenuAnchor.interlocutor)
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
            interlocutorMenuAnchor.interlocutor &&
            handleDeleteInterlocutor(interlocutorMenuAnchor.interlocutor)
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

export default CompanyDetailView;

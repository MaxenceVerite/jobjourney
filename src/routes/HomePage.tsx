import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  alpha,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getOpportunities, updateOpportunity } from "../store/slices/opportunitySlice";
import { fetchDocuments } from "../store/slices/documentSlice";
import { RootState } from "../store/store";
import { EOpportunityState } from "../models/opportunities/Opportunity";
import { DocumentType } from "../models/document";
import DashboardSkeleton from "../components/common/skeletons/DashboardSkeleton";

import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

const HomePage = () => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  const { opportunities, isLoading: isOppLoading } = useSelector(
    (state: RootState) => state.opportunities
  );
  const { documents, isLoading: isDocLoading } = useSelector(
    (state: RootState) => state.documents
  );

  useEffect(() => {
    dispatch(getOpportunities());
    dispatch(fetchDocuments());
  }, [dispatch]);

  const inProgressCount = opportunities.filter(
    (o) =>
      o.state === EOpportunityState.APPLIED ||
      o.state === EOpportunityState.INTERVIEWING ||
      o.state === EOpportunityState.NEGOCIATION_ON_OFFERS
  ).length;

  const totalInterviews = opportunities.reduce(
    (sum, o) => sum + (o.interviews?.length || 0),
    0
  );

  const validatedCount = opportunities.filter(
    (o) => o.state === EOpportunityState.VALIDATED
  ).length;

  const recentOpportunities = [...opportunities]
    .sort(
      (a, b) =>
        new Date(b.lastUpdateDate || b.startDate).getTime() -
        new Date(a.lastUpdateDate || a.startDate).getTime()
    )
    .slice(0, 5);

  const followUpNeeded = opportunities.filter((o) => {
    if (o.state !== EOpportunityState.APPLIED && o.state !== EOpportunityState.INTERVIEWING) {
      return false;
    }
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const dateToCheck = o.lastFollowUpDate 
      ? new Date(o.lastFollowUpDate).getTime() 
      : new Date(o.lastUpdateDate || o.startDate).getTime();
    
    return now - dateToCheck >= SEVEN_DAYS;
  });

  const handleFollowUp = (oppId: string) => {
    dispatch(updateOpportunity({ id: oppId, lastFollowUpDate: new Date() }));
  };

  // --- STATISTIQUES TEMPORELLES ---
  const getStartDate = () => {
    const now = new Date();
    switch (timeRange) {
      case "week":
        return new Date(now.setDate(now.getDate() - 7));
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "year":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0);
    }
  };

  const startDateRange = getStartDate();

  const oppsInRange = opportunities.filter(
    (o) => new Date(o.startDate) >= startDateRange
  );

  const interviewsInRange = opportunities.reduce((sum, o) => {
    const validInterviews = (o.interviews || []).filter(
      (i) => new Date(i.date) >= startDateRange
    );
    return sum + validInterviews.length;
  }, 0);

  const offersInRange = opportunities.filter(
    (o) => (o.state === EOpportunityState.VALIDATED || o.state === EOpportunityState.NEGOCIATION_ON_OFFERS) 
    && new Date(o.lastUpdateDate || o.startDate) >= startDateRange
  ).length;


  const isLoading = (isOppLoading && opportunities.length === 0) || (isDocLoading && documents.length === 0);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Candidatures en cours",
      value: inProgressCount,
      icon: <WorkOutlineRoundedIcon fontSize="large" />,
      color: theme.palette.primary.main,
      bg: alpha(theme.palette.primary.main, 0.1),
      route: "/opportunities",
    },
    {
      title: "Entretiens planifiés",
      value: totalInterviews,
      icon: <EventAvailableRoundedIcon fontSize="large" />,
      color: theme.palette.secondary.main,
      bg: alpha(theme.palette.secondary.main, 0.1),
      route: "/opportunities",
    },
    {
      title: "Offres & Validations",
      value: validatedCount,
      icon: <CheckCircleOutlineRoundedIcon fontSize="large" />,
      color: theme.palette.success.main,
      bg: alpha(theme.palette.success.main, 0.1),
      route: "/opportunities",
    },
    {
      title: "Documents enregistrés",
      value: documents.length,
      icon: <FolderOpenRoundedIcon fontSize="large" />,
      color: "#f59e0b",
      bg: alpha("#f59e0b", 0.1),
      route: "/documents",
    },
  ];

  const getStatusColor = (state: EOpportunityState) => {
    switch (state) {
      case EOpportunityState.INTERVIEWING:
        return "secondary";
      case EOpportunityState.VALIDATED:
        return "success";
      case EOpportunityState.REFUSED:
      case EOpportunityState.ABORTED:
        return "error";
      default:
        return "primary";
    }
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Top Banner */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || '#1e3a8a'} 100%)`,
          color: "common.white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
        }}
      >
        <Box sx={{ width: {xs: "100%", sm: "auto"}, wordBreak: "break-word" }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }} fontWeight={600} gutterBottom>
            Bienvenue sur JobJourney 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Suivez vos candidatures, préparez vos entretiens et organisez votre recherche d'emploi en toute fluidité.
          </Typography>
        </Box>
        <Box display="flex" gap={2} sx={{ width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/opportunities", { state: { openCreateModal: true } })}
            sx={{ px: 3, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
          >
            Nouvelle Opportunité
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/documents", { state: { uploadType: DocumentType.CV } })}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              color: "white",
              borderColor: "rgba(255,255,255,0.4)",
              textTransform: "none",
              fontWeight: 600,
              width: { xs: '100%', sm: 'auto' },
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Importer un document
          </Button>
        </Box>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card, index) => (
          <Grid key={index} item xs={12} sm={6} md={3}>
            <Card
              onClick={() => navigate(card.route)}
              sx={{
                p: 3,
                borderRadius: 2.5,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "all 0.25s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {card.title}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: card.bg,
                    color: card.color,
                    width: 48,
                    height: 48,
                  }}
                >
                  {card.icon}
                </Avatar>
              </Box>
              <Typography variant="h3" fontWeight={700} color="text.primary">
                {card.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Temporal Stats Section */}
      <Card sx={{ p: {xs: 2, md: 3}, borderRadius: 2.5, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <TrendingUpRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={600} color="primary">
              Résumé de votre activité
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, val) => { if (val) setTimeRange(val) }}
            size="small"
            sx={{ 
              bgcolor: "background.paper",
              display: "flex",
              flexWrap: "wrap",
              "& .MuiToggleButtonGroup-grouped": {
                flexGrow: 1
              }
            }}
          >
            <ToggleButton value="week" sx={{ px: {xs: 1, sm: 2}, textTransform: 'none', fontWeight: 600 }}>Semaine</ToggleButton>
            <ToggleButton value="month" sx={{ px: {xs: 1, sm: 2}, textTransform: 'none', fontWeight: 600 }}>Mois</ToggleButton>
            <ToggleButton value="year" sx={{ px: {xs: 1, sm: 2}, textTransform: 'none', fontWeight: 600 }}>Année</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box p={2} borderRadius={2} bgcolor={alpha(theme.palette.primary.main, 0.04)} border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}>
              <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>
                Nouvelles candidatures
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {oppsInRange.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box p={2} borderRadius={2} bgcolor={alpha(theme.palette.secondary.main, 0.04)} border={`1px solid ${alpha(theme.palette.secondary.main, 0.1)}`}>
              <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>
                Entretiens décrochés
              </Typography>
              <Typography variant="h4" fontWeight={700} color="secondary.main">
                {interviewsInRange}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box p={2} borderRadius={2} bgcolor={alpha(theme.palette.success.main, 0.04)} border={`1px solid ${alpha(theme.palette.success.main, 0.1)}`}>
              <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>
                Offres d'embauche
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {offersInRange}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Applications */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: {xs: 2, sm: 3}, borderRadius: 2.5, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <Box display="flex" flexDirection={{xs: "column", sm: "row"}} justifyContent="space-between" alignItems={{xs: "flex-start", sm: "center"}} gap={2} mb={3}>
              <Typography variant="h6" fontWeight={600} color="primary" sx={{ fontSize: {xs: "1.1rem", sm: "1.25rem"} }}>
                Dernières Opportunités
              </Typography>
              <Button
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate("/opportunities")}
                size="small"
                color="secondary"
                sx={{ textTransform: "none", fontWeight: 600, alignSelf: {xs: "flex-start", sm: "auto"} }}
              >
                Voir tout ({opportunities.length})
              </Button>
            </Box>

            {recentOpportunities.length === 0 ? (
              <Box py={5} textAlign="center">
                <WorkOutlineRoundedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Aucune opportunité enregistrée pour le moment.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/opportunities", { state: { openCreateModal: true } })}
                  sx={{ mt: 2, textTransform: "none" }}
                >
                  Créer votre première opportunité
                </Button>
              </Box>
            ) : (
              recentOpportunities.map((opp) => (
                <Card
                  key={opp.id}
                  onClick={() => opp.id && navigate(`/opportunities/${opp.id}`)}
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "none",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "action.hover",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} sx={{ minWidth: 0, mr: 1 }}>
                    <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", fontWeight: 600 }}>
                      {opp.roleTitle.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="text.primary" noWrap>
                        {opp.roleTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {opp.location || opp.industry || "Non renseigné"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                    <Chip
                      label={opp.state}
                      color={getStatusColor(opp.state) as any}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                    <IconButton size="small" color="inherit">
                      <ArrowForwardRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              ))
            )}
          </Card>
        </Grid>

        {/* Right Sidebar: Quick Actions & Recent Docs */}
        <Grid item xs={12} md={4}>
          {/* Section À Relancer */}
          {followUpNeeded.length > 0 && (
            <Card sx={{ p: 3, borderRadius: 2.5, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", mb: 3, borderLeft: "4px solid", borderColor: "warning.main" }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <NotificationsActiveRoundedIcon color="warning" />
                <Typography variant="h6" fontWeight={600} color="warning.main">
                  À Relancer ({followUpNeeded.length})
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                Ces candidatures n'ont pas eu d'activité depuis plus de 7 jours.
              </Typography>

              {followUpNeeded.slice(0, 4).map((opp) => (
                <Box
                  key={opp.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 1.5,
                    mb: 1.5,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '70%' }}>
                      {opp.roleTitle}
                    </Typography>
                    <Chip 
                      label={opp.state === EOpportunityState.APPLIED ? "Postulé" : "Entretien"} 
                      size="small" 
                      color="warning" 
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.65rem" }} 
                    />
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    color="warning"
                    startIcon={<CheckRoundedIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if(opp.id) handleFollowUp(opp.id);
                    }}
                    sx={{ textTransform: "none", alignSelf: "flex-start", mt: 0.5 }}
                  >
                    Marquer relancé
                  </Button>
                </Box>
              ))}
              
              {followUpNeeded.length > 4 && (
                <Button size="small" fullWidth onClick={() => navigate("/opportunities")}>
                  Voir toutes les relances
                </Button>
              )}
            </Card>
          )}

          <Card sx={{ p: 3, borderRadius: 2.5, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", mb: 3 }}>
            <Typography variant="h6" fontWeight={600} color="primary" mb={2}>
              Documents Récents
            </Typography>

            {documents.length === 0 ? (
              <Box py={3} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Aucun document importé.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={() => navigate("/documents", { state: { uploadType: DocumentType.CV } })}
                  sx={{ mt: 1.5, textTransform: "none" }}
                >
                  Importer un CV
                </Button>
              </Box>
            ) : (
              documents.slice(0, 4).map((doc) => (
                <Box
                  key={doc.id}
                  onClick={() => navigate("/documents", { state: { openDocId: doc.id } })}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: "action.hover", transform: "translateX(3px)" },
                  }}
                >
                  <DescriptionOutlinedIcon color="secondary" />
                  <Box flexGrow={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {doc.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.type} • {new Date(doc.uploadedDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
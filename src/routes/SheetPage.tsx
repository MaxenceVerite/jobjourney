import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Skeleton,
  Tooltip,
  Divider,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { RootState } from "../store/store";
import { getCompanies } from "../store/slices/companySlice";
import { getInterlocutors } from "../store/slices/interlocutorSlice";
import { getOpportunities } from "../store/slices/opportunitySlice";
import { useModal } from "../contexts/ModalContext";

import CompanyDetailView from "../components/sheets/CompanyDetailView";
import IndependentContactsView from "../components/sheets/IndependentContactsView";
import CompanyModal from "../components/sheets/CompanyModal";
import InterlocutorModal from "../components/sheets/InterlocutorModal";
import { getOpportunityStateLabel } from "../helpers/opportunityFormatters";

import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";

export const SheetPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { openModal, closeModal } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "ACTIVE">("ALL");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | "INDEPENDENT_CONTACTS">("");

  const { companies, isLoading: companiesLoading } = useSelector(
    (state: RootState) => state.companies
  );
  const { interlocutors, isLoading: interlocutorsLoading } = useSelector(
    (state: RootState) => state.interlocutors
  );
  const { opportunities } = useSelector((state: RootState) => state.opportunities);

  useEffect(() => {
    dispatch(getCompanies());
    dispatch(getInterlocutors());
    dispatch(getOpportunities());
  }, [dispatch]);

  // Handle URL param selection if present
  useEffect(() => {
    const companyFromUrl = searchParams.get("companyId");
    if (companyFromUrl) {
      setSelectedCompanyId(companyFromUrl);
    }
  }, [searchParams]);

  // Set default selection when companies load
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id || "");
    }
  }, [companies, selectedCompanyId]);

  const handleOpenCreateCompanyModal = () => {
    openModal(
      "Nouvelle Entreprise",
      <CompanyModal
        onClose={closeModal}
        onSuccess={(created) => {
          if (created.id) setSelectedCompanyId(created.id);
        }}
      />
    );
  };

  const handleOpenCreateInterlocutorModal = () => {
    openModal(
      "Nouvel Interlocuteur / Recruteur",
      <InterlocutorModal
        preselectedCompanyId={
          selectedCompanyId !== "INDEPENDENT_CONTACTS" ? selectedCompanyId : undefined
        }
        onClose={closeModal}
      />
    );
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const compOpps = opportunities.filter((o) => o.companyId === c.id);
      const hasActiveOpp = compOpps.some(
        (o) =>
          o.state !== "ARCHIVED" &&
          o.state !== "REFUSED" &&
          o.state !== "ABORTED"
      );

      if (filterMode === "ACTIVE" && !hasActiveOpp) return false;

      if (!q) return true;
      const compInterlocutors = interlocutors.filter((i) => i.companyId === c.id);
      const matchesInterlocutor = compInterlocutors.some((i) =>
        `${i.firstName} ${i.lastName}`.toLowerCase().includes(q)
      );

      return (
        c.name.toLowerCase().includes(q) ||
        (c.websiteUrl && c.websiteUrl.toLowerCase().includes(q)) ||
        matchesInterlocutor
      );
    });
  }, [companies, opportunities, interlocutors, searchQuery, filterMode]);

  const independentInterlocutors = useMemo(() => {
    return interlocutors.filter((i) => !i.companyId);
  }, [interlocutors]);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  const getFaviconUrl = (url?: string) => {
    if (!url) return null;
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
    } catch {
      return null;
    }
  };

  const isLoading = companiesLoading || interlocutorsLoading;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Top Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Mes Fiches
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Pilotez vos entreprises cibles, contacts clés et offres associées en un seul endroit.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PeopleAltRoundedIcon />}
            onClick={handleOpenCreateInterlocutorModal}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              px: 2,
            }}
          >
            Nouveau Contact
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreateCompanyModal}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              px: 2.2,
              boxShadow: "0 4px 12px rgba(27, 44, 191, 0.2)",
            }}
          >
            Nouvelle Entreprise
          </Button>
        </Box>
      </Box>

      {/* Main 2-Column Master-Detail Layout */}
      {companies.length === 0 && !isLoading ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px dashed rgba(0,0,0,0.12)",
            textAlign: "center",
          }}
        >
          <BusinessRoundedIcon sx={{ fontSize: 56, color: "text.secondary", opacity: 0.4, mb: 1.5 }} />
          <Typography variant="h5" fontWeight={700} color="primary.main" mb={1}>
            Votre carnet d'entreprises est vide
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={500} mx="auto" mb={3}>
            Ajoutez votre première entreprise cible pour y regrouper vos contacts (RH, managers) et vos candidatures associées.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreateCompanyModal}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
          >
            Ajouter une entreprise
          </Button>
        </Paper>
      ) : (
        <Box display="flex" gap={3} alignItems="flex-start">
          {/* LEFT MASTER LIST (360px on desktop) */}
          {(!isMobile || !selectedCompanyId) && (
            <Paper
              elevation={0}
              sx={{
                width: { xs: "100%", md: 360 },
                flexShrink: 0,
                borderRadius: 3,
                bgcolor: "background.paper",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 4px 16px rgba(27, 44, 191, 0.04)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                maxHeight: "calc(100vh - 180px)",
              }}
            >
              {/* Search & Filter Header */}
              <Box p={2} borderBottom="1px solid" borderColor="divider">
                <TextField
                  size="small"
                  placeholder="Rechercher une entreprise, contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 1.5,
                    "& .MuiInputBase-root": {
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    },
                  }}
                />

                {/* Filter Pills */}
                <Box display="flex" gap={1}>
                  <Chip
                    label={`Toutes (${companies.length})`}
                    size="small"
                    clickable
                    onClick={() => setFilterMode("ALL")}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      bgcolor:
                        filterMode === "ALL"
                          ? alpha(theme.palette.primary.main, 0.12)
                          : "action.hover",
                      color: filterMode === "ALL" ? "primary.main" : "text.secondary",
                      borderColor: filterMode === "ALL" ? "primary.main" : "transparent",
                    }}
                  />
                  <Chip
                    label="En process actif"
                    size="small"
                    clickable
                    onClick={() => setFilterMode("ACTIVE")}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      bgcolor:
                        filterMode === "ACTIVE"
                          ? alpha(theme.palette.success.main, 0.15)
                          : "action.hover",
                      color: filterMode === "ACTIVE" ? "success.dark" : "text.secondary",
                    }}
                  />
                </Box>
              </Box>

              {/* Scrollable Company List */}
              <Box sx={{ overflowY: "auto", flexGrow: 1, p: 1 }}>
                {filteredCompanies.map((comp) => {
                  const isSelected = selectedCompanyId === comp.id;
                  const compOpps = opportunities.filter((o) => o.companyId === comp.id);
                  const compInterlocutors = interlocutors.filter(
                    (i) => i.companyId === comp.id
                  );
                  const favicon = getFaviconUrl(comp.websiteUrl);

                  return (
                    <Box
                      key={comp.id}
                      onClick={() => {
                        if (comp.id) setSelectedCompanyId(comp.id);
                      }}
                      sx={{
                        p: 1.5,
                        mb: 0.8,
                        borderRadius: 2,
                        cursor: "pointer",
                        borderLeft: isSelected ? "4px solid" : "4px solid transparent",
                        borderColor: isSelected ? "primary.main" : "transparent",
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.06)
                          : "transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.08)
                            : alpha(theme.palette.primary.main, 0.03),
                        },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
                        <Avatar
                          src={favicon || undefined}
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            borderRadius: 1.5,
                          }}
                        >
                          {comp.name.charAt(0).toUpperCase()}
                        </Avatar>

                        <Box minWidth={0}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={isSelected ? 700 : 600}
                            color={isSelected ? "primary.main" : "text.primary"}
                            noWrap
                          >
                            {comp.name}
                          </Typography>

                          <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                              👥 {compInterlocutors.length} contact{compInterlocutors.length > 1 ? "s" : ""}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                              💼 {compOpps.length} offre{compOpps.length > 1 ? "s" : ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <ArrowForwardIosRoundedIcon
                        sx={{
                          fontSize: 12,
                          color: isSelected ? "primary.main" : "action.disabled",
                        }}
                      />
                    </Box>
                  );
                })}

                {/* Independent Contacts Row at the bottom */}
                <Divider sx={{ my: 1 }} />
                <Box
                  onClick={() => setSelectedCompanyId("INDEPENDENT_CONTACTS")}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: "pointer",
                    borderLeft:
                      selectedCompanyId === "INDEPENDENT_CONTACTS"
                        ? "4px solid"
                        : "4px solid transparent",
                    borderColor:
                      selectedCompanyId === "INDEPENDENT_CONTACTS"
                        ? "secondary.main"
                        : "transparent",
                    bgcolor:
                      selectedCompanyId === "INDEPENDENT_CONTACTS"
                        ? alpha(theme.palette.secondary.main, 0.1)
                        : "transparent",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha(theme.palette.secondary.main, 0.15),
                        color: "primary.main",
                      }}
                    >
                      <PeopleAltRoundedIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={
                          selectedCompanyId === "INDEPENDENT_CONTACTS" ? 700 : 600
                        }
                        color="text.primary"
                        fontSize="0.85rem"
                      >
                        Chasseurs & Indépendants
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {independentInterlocutors.length} contact{independentInterlocutors.length > 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForwardIosRoundedIcon
                    sx={{
                      fontSize: 12,
                      color:
                        selectedCompanyId === "INDEPENDENT_CONTACTS"
                          ? "primary.main"
                          : "action.disabled",
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          )}

          {/* RIGHT DETAIL PANE */}
          {(!isMobile || selectedCompanyId) && (
            <Box sx={{ flexGrow: 1, minWidth: 0, width: { xs: "100%", md: "auto" } }}>
              {selectedCompanyId === "INDEPENDENT_CONTACTS" ? (
                <IndependentContactsView
                  showBackButton={isMobile}
                  onBack={() => setSelectedCompanyId("")}
                />
              ) : selectedCompany ? (
                <CompanyDetailView
                  company={selectedCompany}
                  showBackButton={isMobile}
                  onBack={() => setSelectedCompanyId("")}
                />
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    border: "1px dashed rgba(0,0,0,0.12)",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="subtitle1" color="text.secondary">
                    Sélectionnez une entreprise dans la colonne de gauche pour afficher sa fiche complète.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SheetPage;
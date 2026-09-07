import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Grid,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Button,
  Typography,
  Chip,
  MenuItem,
  useTheme,
  alpha,
} from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { getOpportunities } from "../../store/slices/opportunitySlice";
import { RootState } from "../../store/store";

import OpportunityCardList from "../../components/opportunities/OpportunityCardList";
import OpportunityCardSkeleton from "../../components/common/skeletons/OpportunityCardSkeleton";
import CreateOpportunityForm from "../../components/opportunities/CreateOpportunityForm";
import KanbanBoard from "../../components/opportunities/kanban/KanbanBoard";
import { useModal } from "../../contexts/ModalContext";
import Opportunity, {
  EOpportunityState,
  RemoteCondition,
} from "../../models/opportunities/Opportunity";

import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";

const OpportunitiesListContent = () => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  const [viewMode, setViewMode] = useState<"kanban" | "list">(() => {
    return (localStorage.getItem("myjobboard_opportunities_view") as "kanban" | "list") || "kanban";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [remoteFilter, setRemoteFilter] = useState<string>("ALL");

  const { opportunities, isLoading } = useSelector(
    (state: RootState) => state.opportunities
  );
  const companies = useSelector((state: RootState) => state.companies.companies);

  const handleViewChange = (_: any, newView: "kanban" | "list" | null) => {
    if (newView) {
      setViewMode(newView);
      localStorage.setItem("myjobboard_opportunities_view", newView);
    }
  };

  const handleOpenCreateModal = (initialState?: EOpportunityState) => {
    openModal(
      "Créer une opportunité",
      <CreateOpportunityForm
        onSubmit={closeModal}
        onClose={closeModal}
        initialState={initialState}
      />
    );
  };

  const hasTriggeredCreateModalRef = useRef(false);

  useEffect(() => {
    dispatch(getOpportunities());
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.openCreateModal && !hasTriggeredCreateModalRef.current) {
      hasTriggeredCreateModalRef.current = true;
      handleOpenCreateModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openCreateModal]);

  // Filtered opportunities based on search and remote filters
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const company = companies.find((c) => c.id === opp.companyId);
      const companyName = company?.name || "";

      const matchesSearch =
        opp.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opp.location && opp.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRemote =
        remoteFilter === "ALL" || opp.remoteCondition === remoteFilter;

      return matchesSearch && matchesRemote;
    });
  }, [opportunities, companies, searchQuery, remoteFilter]);

  const opportunitiesInProgress = useMemo(() => {
    return filteredOpportunities.filter(
      (opp) =>
        opp.state === EOpportunityState.DRAFT ||
        opp.state === EOpportunityState.APPLIED ||
        opp.state === EOpportunityState.INTERVIEWING ||
        opp.state === EOpportunityState.NEGOCIATION_ON_OFFERS
    );
  }, [filteredOpportunities]);

  const archivedOpportunities = useMemo(() => {
    return filteredOpportunities.filter(
      (opp) =>
        opp.state === EOpportunityState.REFUSED ||
        opp.state === EOpportunityState.ABORTED ||
        opp.state === EOpportunityState.VALIDATED ||
        opp.state === EOpportunityState.ARCHIVED
    );
  }, [filteredOpportunities]);

  if (isLoading && opportunities.length === 0) {
    return (
      <Box sx={{ width: "100%", mt: 1 }}>
        <OpportunityCardSkeleton count={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Controls Bar: Search, Filters, View Switcher & Add Button */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2.5,
          boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
        }}
      >
        {/* Left Side: Search & Remote filter */}
        <Box display="flex" alignItems="center" gap={1.5} flexGrow={1} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Filtrer par poste, entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", sm: 260 },
              "& .MuiInputBase-root": {
                borderRadius: 2,
                boxShadow: "none",
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              },
            }}
          />

          <TextField
            select
            size="small"
            value={remoteFilter}
            onChange={(e) => setRemoteFilter(e.target.value)}
            sx={{
              minWidth: 140,
              "& .MuiInputBase-root": {
                borderRadius: 2,
                boxShadow: "none",
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              },
            }}
          >
            <MenuItem value="ALL">Tous les modes</MenuItem>
            <MenuItem value={RemoteCondition.Remote}>Remote</MenuItem>
            <MenuItem value={RemoteCondition.Hybrid}>Hybride</MenuItem>
            <MenuItem value={RemoteCondition.Office}>Présentiel</MenuItem>
          </TextField>

          {searchQuery && (
            <Chip
              label={`Résultats : ${filteredOpportunities.length}`}
              size="small"
              onDelete={() => setSearchQuery("")}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Right Side: View Mode Switcher & Add Button */}
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              p: 0.3,
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: 1.5,
                px: 1.5,
                py: 0.6,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.85rem",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                },
              },
            }}
          >
            <ToggleButton value="kanban">
              <ViewKanbanRoundedIcon fontSize="small" sx={{ mr: 0.8 }} />
              Kanban
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListRoundedIcon fontSize="small" sx={{ mr: 0.8 }} />
              Liste
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            color="success"
            startIcon={<AddRoundedIcon />}
            onClick={() => handleOpenCreateModal()}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              px: 2.2,
              whiteSpace: "nowrap",
            }}
          >
            Nouvelle Opportunité
          </Button>
        </Box>
      </Box>

      {/* Main Content: Kanban Board or Classic List View */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          opportunities={filteredOpportunities}
          onAddOpportunity={handleOpenCreateModal}
        />
      ) : (
        <Grid container spacing={2}>
          <OpportunityCardList
            title="En cours"
            opportunities={opportunitiesInProgress}
            canAddOpportunity
            isExpanded
          />
          <OpportunityCardList
            title="Archivés"
            opportunities={archivedOpportunities}
            canAddOpportunity={false}
            isExpanded={false}
          />
        </Grid>
      )}
    </Box>
  );
};

export default OpportunitiesListContent;

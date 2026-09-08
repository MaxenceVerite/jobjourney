import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Badge,
  useMediaQuery,
  useTheme,
  Button,
  Typography,
  alpha,
} from "@mui/material";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import Opportunity, { EOpportunityState } from "../../../models/opportunities/Opportunity";
import { updateOpportunity } from "../../../store/slices/opportunitySlice";
import { useModal } from "../../../contexts/ModalContext";
import ArchiveOpportunityModal from "../ArchiveOpportunityModal";
import KanbanColumn, { ColumnDefinition } from "./KanbanColumn";
import KanbanCard from "./KanbanCard";

import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

interface KanbanBoardProps {
  opportunities: Opportunity[];
  onAddOpportunity: (state?: EOpportunityState) => void;
}

export const KANBAN_COLUMNS: ColumnDefinition[] = [
  {
    id: "col-draft",
    state: EOpportunityState.DRAFT,
    title: "Brouillons",
    icon: <EditNoteRoundedIcon fontSize="small" />,
    color: "#64748b",
  },
  {
    id: "col-applied",
    state: EOpportunityState.APPLIED,
    title: "Candidatures",
    icon: <SendRoundedIcon fontSize="small" />,
    color: "#1b2cbf",
  },
  {
    id: "col-interviewing",
    state: EOpportunityState.INTERVIEWING,
    title: "Entretiens",
    icon: <QuestionAnswerRoundedIcon fontSize="small" />,
    color: "#7690ff",
  },
  {
    id: "col-negociation",
    state: EOpportunityState.NEGOCIATION_ON_OFFERS,
    title: "Offres",
    icon: <HandshakeRoundedIcon fontSize="small" />,
    color: "#f59e0b",
  },
  {
    id: "col-validated",
    state: EOpportunityState.VALIDATED,
    title: "Validées",
    icon: <CheckCircleRoundedIcon fontSize="small" />,
    color: "#22c55e",
  },
  {
    id: "col-archived",
    state: EOpportunityState.REFUSED,
    title: "Refusé / Archivé",
    icon: <ArchiveRoundedIcon fontSize="small" />,
    color: "#94a3b8",
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  opportunities,
  onAddOpportunity,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { openModal, closeModal } = useModal();

  const [activeMobileTab, setActiveMobileTab] = useState<number>(1); // Default to "Candidatures" on mobile

  const getColumnOpportunities = (state: EOpportunityState) => {
    if (state === EOpportunityState.REFUSED) {
      return opportunities.filter(
        (o) =>
          o.state === EOpportunityState.REFUSED ||
          o.state === EOpportunityState.ABORTED ||
          o.state === EOpportunityState.ARCHIVED
      );
    }
    return opportunities.filter((o) => o.state === state);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const movedOpportunity = opportunities.find(
      (o) => (o.id || `opp-${source.index}`) === draggableId
    );

    if (!movedOpportunity) return;

    const targetState = destination.droppableId as EOpportunityState;

    const updatedOpportunity: Opportunity = {
      ...movedOpportunity,
      state: targetState,
      lastUpdateDate: new Date(),
    };

    dispatch(updateOpportunity({ opportunity: updatedOpportunity }));

    if (
      targetState === EOpportunityState.REFUSED ||
      targetState === EOpportunityState.ARCHIVED ||
      targetState === EOpportunityState.ABORTED
    ) {
      openModal(
        "Archiver / Clôturer l'opportunité",
        <ArchiveOpportunityModal
          opportunity={updatedOpportunity}
          onClose={closeModal}
        />
      );
    }
  };

  // MOBILE VIEW: Tabs + Full-width active column
  if (isMobile) {
    const currentColumn = KANBAN_COLUMNS[activeMobileTab];
    const currentColumnOpps = getColumnOpportunities(currentColumn.state);

    return (
      <Box sx={{ width: "100%", pb: 4 }}>
        {/* Mobile Stage Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 2.5,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <Tabs
            value={activeMobileTab}
            onChange={(_, newValue) => setActiveMobileTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              "& .MuiTab-root": {
                minHeight: 52,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.88rem",
              },
            }}
          >
            {KANBAN_COLUMNS.map((col, idx) => {
              const count = getColumnOpportunities(col.state).length;
              return (
                <Tab
                  key={col.id}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      {col.icon}
                      <span>{col.title}</span>
                      <Box
                        sx={{
                          px: 0.8,
                          py: 0.2,
                          borderRadius: 5,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          bgcolor: activeMobileTab === idx ? alpha(col.color, 0.2) : "action.hover",
                          color: col.color,
                        }}
                      >
                        {count}
                      </Box>
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Column Banner on Mobile with Quick Add */}
        <Box
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          mb={2}
          p={1.5}
          borderRadius={2}
          bgcolor={alpha(currentColumn.color, 0.08)}
        >
          <Box display="flex" alignItems="center" gap={1} flexGrow={1}>
            <Box sx={{ color: currentColumn.color }}>{currentColumn.icon}</Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ wordBreak: 'break-word' }}>
              {currentColumn.title} ({currentColumnOpps.length})
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={() => onAddOpportunity(currentColumn.state)}
            sx={{
              bgcolor: currentColumn.color,
              "&:hover": { bgcolor: currentColumn.color },
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              width: { xs: "100%", sm: "auto" }
            }}
          >
            Ajouter
          </Button>
        </Box>

        {/* List of Mobile Cards */}
        {currentColumnOpps.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={6}
            border="1px dashed"
            borderColor="divider"
            borderRadius={3}
            bgcolor="background.paper"
          >
            <Typography variant="body1" color="text.secondary" fontWeight={500} mb={1.5}>
              Aucune opportunité dans "{currentColumn.title}"
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => onAddOpportunity(currentColumn.state)}
              sx={{ textTransform: "none" }}
            >
              Créer une candidature
            </Button>
          </Box>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={currentColumn.state}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ minHeight: 100 }}
                >
                  {currentColumnOpps.map((opp, index) => (
                    <KanbanCard key={opp.id || index} opportunity={opp} index={index} />
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Box>
    );
  }

  // DESKTOP VIEW: Full DragDropContext with side-by-side columns
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          pt: 0.5,
          height: "calc(100vh - 220px)",
          alignItems: "stretch",
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: alpha(theme.palette.primary.main, 0.2),
            borderRadius: "6px",
          },
        }}
      >
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            opportunities={getColumnOpportunities(column.state)}
            onAddOpportunity={onAddOpportunity}
          />
        ))}
      </Box>
    </DragDropContext>
  );
};

export default KanbanBoard;

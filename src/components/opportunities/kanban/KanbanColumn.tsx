import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Card,
  alpha,
  useTheme,
} from "@mui/material";
import { Droppable } from "@hello-pangea/dnd";
import Opportunity, { EOpportunityState } from "../../../models/opportunities/Opportunity";
import KanbanCard from "./KanbanCard";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

export interface ColumnDefinition {
  id: string;
  state: EOpportunityState;
  title: string;
  icon: React.ReactNode;
  color: string;
}

interface KanbanColumnProps {
  column: ColumnDefinition;
  opportunities: Opportunity[];
  onAddOpportunity: (state: EOpportunityState) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  opportunities,
  onAddOpportunity,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: "1 1 300px",
        minWidth: { xs: "100%", md: "280px" },
        maxWidth: { xs: "100%", md: "340px" },
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: alpha(column.color, 0.03),
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(column.color, 0.12),
        p: 1.5,
      }}
    >
      {/* Column Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
        px={0.5}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: column.color,
            }}
          >
            {column.icon}
          </Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="text.primary"
            sx={{ fontSize: "0.95rem" }}
          >
            {column.title}
          </Typography>
          <Chip
            label={opportunities.length}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.75rem",
              fontWeight: 700,
              bgcolor: alpha(column.color, 0.15),
              color: column.color,
            }}
          />
        </Box>

        <IconButton
          size="small"
          onClick={() => onAddOpportunity(column.state)}
          sx={{
            bgcolor: "background.paper",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            color: column.color,
            "&:hover": {
              bgcolor: column.color,
              color: "white",
            },
          }}
        >
          <AddRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Droppable Area */}
      <Droppable droppableId={column.state}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flexGrow: 1,
              minHeight: "450px",
              maxHeight: "calc(100vh - 280px)",
              overflowY: "auto",
              pr: 0.5,
              borderRadius: 2,
              transition: "background-color 0.2s ease",
              bgcolor: snapshot.isDraggingOver
                ? alpha(column.color, 0.1)
                : "transparent",
              "&::-webkit-scrollbar": {
                width: "5px",
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                borderRadius: "4px",
              },
            }}
          >
            {opportunities.map((opp, index) => (
              <KanbanCard key={opp.id || index} opportunity={opp} index={index} />
            ))}
            {provided.placeholder}

            {opportunities.length === 0 && !snapshot.isDraggingOver && (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="150px"
                border="1px dashed"
                borderColor="divider"
                borderRadius={2}
                sx={{ opacity: 0.6 }}
              >
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Déposer ici
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

export default KanbanColumn;

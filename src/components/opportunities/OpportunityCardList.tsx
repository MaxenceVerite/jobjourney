import React from "react";
import ActionableSection from "../common/ActionableSection";
import { Button, Card, Grid } from "@mui/material";
import OpportunityCard from "./OpportunityCard";
import { useModal } from "../../contexts/ModalContext";
import CreateOpportunityForm from "./CreateOpportunityForm";
import Opportunity from "../../models/opportunities/Opportunity";

interface OpportunityCardListProps {
  title: string;
  opportunities: Opportunity[];
  canAddOpportunity?: boolean;
  isExpanded: boolean;
}

const OpportunityCardList = ({
  title,
  opportunities,
  canAddOpportunity,
  isExpanded,
}: OpportunityCardListProps) => {
  const { openModal, closeModal } = useModal();

  const openOpportunityCreationModal = () => {
    openModal(
      "Créer une opportunité",
      <CreateOpportunityForm onSubmit={closeModal} onClose={closeModal} />
    );
  };

  const handleFilter = () => {

  };

  const handleSearch = ()=> {

  }

  if ((!opportunities || opportunities.length == 0) && !canAddOpportunity)
    return null;

  return (
    <ActionableSection
    onAddElement={openOpportunityCreationModal}
    onFilter={handleFilter}
    onSearch={handleSearch}
    isExpanded={isExpanded} 
    sectionTitle={title}>
      <Grid marginY={3} paddingX={3} item xs={12}>
        {opportunities.map((opp, index) => (
          <OpportunityCard key={opp.id || index} opportunity={opp} />
        ))}
        {canAddOpportunity && (
          <Card
            sx={{
              height: "8vh",
              mb: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={() => openOpportunityCreationModal()}
              sx={{height: "100%", width:"100%" }}
              
            >
              +
            </Button>
          </Card>
        )}
      </Grid>
    </ActionableSection>
  );
};

export default OpportunityCardList;

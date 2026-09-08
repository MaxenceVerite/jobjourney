import React, { useState } from "react";
import {
  Button,
  Container,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import Opportunity, {
  EOpportunityState,
  RemoteCondition,
} from "../../models/opportunities/Opportunity";
import CompanyPicker from "../compagnies/CompagnyPicker";
import { useDispatch } from "react-redux";
import { createOpportunity } from "../../store/slices/opportunitySlice";
import { useTranslation } from "react-i18next";

interface CreateOpportunityFormProps {
  onClose: () => void;
  onSubmit: () => void;
  initialState?: EOpportunityState;
}

const CreateOpportunityForm = ({
  onClose,
  onSubmit,
  initialState,
}: CreateOpportunityFormProps) => {
  const [opportunityData, setOpportunityData] = useState<Opportunity>({
    roleTitle: "",
    startDate: new Date(),
    lastUpdateDate: new Date(),
    state: initialState || EOpportunityState.DRAFT,
    remoteCondition: RemoteCondition.Office,
  });

  const dispatch = useDispatch<any>();
  const { t } = useTranslation();
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOpportunityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    dispatch(createOpportunity({ opportunity: opportunityData }));
    onSubmit();
  };

  const handleCancel = (e) => {
    e.preventDefault();
    onClose();
  };

  const handleCompanySelect = (companyId: string) => {
    setOpportunityData((prev) => ({ ...prev, companyId: companyId }));
  };

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <FormControl fullWidth margin="normal">
          <CompanyPicker onCompanySelect={handleCompanySelect} />
        </FormControl>
        <TextField
          margin="normal"
          required
          fullWidth
          placeholder="Titre"
          name="roleTitle"
          variant="standard"
          value={opportunityData.roleTitle}
          onChange={handleInputChange}
        />
        <TextField
          value={opportunityData.remoteCondition}
          variant="standard"
          id="remoteCondition"
          name="remoteCondition"
          select
          fullWidth
          margin="normal"
          placeholder="Condition TT"
          onChange={handleInputChange}
        >
          {Object.values(RemoteCondition).map((condition) => (
            <MenuItem key={condition} value={condition}>
              {t(`RemoteCondition.${condition}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id="startDate"
          placeholder="Date de début du process"
          type="date"
          name="startDate"
          value={opportunityData.startDate}
          onChange={handleInputChange}
          InputLabelProps={{
            shrink: true,
          }}
          variant="standard"
          margin="normal"
          fullWidth
        />
        <FormControl fullWidth margin="normal">
          <Button color="primary" type="submit" fullWidth variant="contained">
            Créer
          </Button>
        </FormControl>
      </Box>

      <Box></Box>
    </Container>
  );
};

export default CreateOpportunityForm;

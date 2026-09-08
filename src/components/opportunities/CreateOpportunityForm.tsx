import React, { useState } from "react";
import {
  Button,
  Container,
  TextField,
  FormControl,
  MenuItem,
  Box,
  Typography,
  Grid,
} from "@mui/material";
import Opportunity, {
  EOpportunityState,
  RemoteCondition,
} from "../../models/opportunities/Opportunity";
import CompanyPicker from "../compagnies/CompagnyPicker";
import { useDispatch } from "react-redux";
import { createOpportunity } from "../../store/slices/opportunitySlice";
import { useTranslation } from "react-i18next";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

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
    e.preventDefault();
    dispatch(createOpportunity({ opportunity: opportunityData }));
    onSubmit();
  };

  const handleCompanySelect = (companyId: string) => {
    setOpportunityData((prev) => ({ ...prev, companyId: companyId }));
  };

  return (
    <Container maxWidth="sm" sx={{ py: {xs: 1, sm: 2}, px: {xs: 1, sm: 3} }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: {xs: "0.85rem", sm: "0.875rem"} }}>
          Remplissez les informations ci-dessous pour ajouter une nouvelle opportunité à votre tableau.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <CompanyPicker onCompanySelect={handleCompanySelect} />
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Titre du poste"
              placeholder="Ex: Développeur Fullstack React"
              name="roleTitle"
              variant="outlined"
              value={opportunityData.roleTitle}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              value={opportunityData.remoteCondition}
              variant="outlined"
              id="remoteCondition"
              name="remoteCondition"
              select
              fullWidth
              label="Condition de télétravail"
              onChange={handleInputChange}
            >
              {Object.values(RemoteCondition).map((condition) => (
                <MenuItem key={condition} value={condition}>
                  {t(`RemoteCondition.${condition}`)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              id="startDate"
              label="Date de début du processus"
              type="date"
              name="startDate"
              value={opportunityData.startDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              fullWidth
            />
          </Grid>
        </Grid>

        <Box display="flex" flexDirection={{xs: "column-reverse", sm: "row"}} justifyContent="flex-end" gap={2} mt={{xs: 3, sm: 5}}>
          <Button
            variant="text"
            color="inherit"
            fullWidth
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            sx={{ fontWeight: 600, textTransform: "none", width: {sm: "auto"} }}
          >
            Annuler
          </Button>
          <Button
            color="primary"
            type="submit"
            variant="contained"
            fullWidth
            startIcon={<AddRoundedIcon />}
            disabled={!opportunityData.roleTitle || !opportunityData.companyId}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(27, 44, 191, 0.2)",
              width: {sm: "auto"}
            }}
          >
            Ajouter
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateOpportunityForm;

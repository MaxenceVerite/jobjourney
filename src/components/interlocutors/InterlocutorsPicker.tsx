import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getInterlocutors,
  createInterlocutor,
} from "../../store/slices/interlocutorSlice";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Interlocutor from "../../models/opportunities/Interlocutor";
import { RootState } from "../../store/store";
import { Box, Chip, Collapse, Grid, Paper, Typography, alpha, useTheme } from "@mui/material";
import { Add, PersonAddAlt1Rounded } from "@mui/icons-material";
import CompanyPicker from "../compagnies/CompagnyPicker";

const filter = createFilterOptions<InterlocutorOption>();

interface InterlocutorsPickerProps {
  companyId?: string;
  canCreate?: boolean;
  preselectedInterlocutors?: string[];
  onInterlocutorsSelectionChange: (interlocutorIds: string[]) => void;
}

interface InterlocutorOption extends Interlocutor {
  inputValue?: string;
}

const InterlocutorsPicker = ({
  companyId,
  canCreate,
  preselectedInterlocutors,
  onInterlocutorsSelectionChange,
}: InterlocutorsPickerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedInterlocutors, setSelectedInterlocutors] = useState<InterlocutorOption[]>([]);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    role: "",
    companyId: companyId || "",
  });

  const interlocutors = useSelector(
    (state: RootState) => state.interlocutors.interlocutors
  );
  const dispatch = useDispatch<any>();
  const canShowCreateForm = canCreate ?? false;
  const theme = useTheme();

  useEffect(() => {
    dispatch(getInterlocutors());
  }, [dispatch]);

  useEffect(() => {
    if (interlocutors.length > 0) {
      const preselected = interlocutors.filter((interlocutor) =>
        preselectedInterlocutors?.includes(interlocutor.id!)
      );
      setSelectedInterlocutors(preselected);
    }
  }, [interlocutors, preselectedInterlocutors]);

  const handleFormSubmit = async () => {
    if (formValues.firstName && formValues.lastName) {
      const newInterlocutor: Interlocutor = {
        companyId: formValues.companyId,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        role: formValues.role,
      };

      const resultAction = await dispatch(
        createInterlocutor({ interlocutor: newInterlocutor })
      );

      if (createInterlocutor.fulfilled.match(resultAction)) {
        const createdInterlocutor = resultAction.payload;
        const updatedSelected = [...selectedInterlocutors, createdInterlocutor];
        setSelectedInterlocutors(updatedSelected);
        
        setFormValues({
          firstName: "",
          lastName: "",
          role: "",
          companyId: companyId || "",
        });
        setShowForm(false);
        onInterlocutorsSelectionChange(
          updatedSelected.map((interlocutor) => interlocutor.id!)
        );
      }
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 2, mb: 1 }}>
      <Autocomplete
        multiple
        value={selectedInterlocutors}
        onChange={(event, newValue) => {
          // Gérer le clic sur "Ajouter xxx"
          const latestVal = newValue[newValue.length - 1];
          if (latestVal && latestVal.inputValue) {
            // Ouvrir le formulaire pré-rempli
            const names = latestVal.inputValue.split(" ");
            setFormValues({
              ...formValues,
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
            });
            setShowForm(true);
            return; // on n'ajoute pas l'élément "Ajouter" à la liste
          }

          setSelectedInterlocutors(newValue);
          onInterlocutorsSelectionChange(
            newValue.map((interlocutor) => interlocutor.id!)
          );
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          const { inputValue } = params;
          
          if (inputValue !== "" && canShowCreateForm) {
            filtered.push({
              inputValue,
              firstName: `Ajouter "${inputValue}"`,
              lastName: "",
              role: "",
              companyId: "",
            });
          }
          return filtered;
        }}
        options={interlocutors}
        getOptionLabel={(option) => {
          if (option.inputValue) return option.inputValue;
          return `${option.firstName} ${option.lastName}`;
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Sélectionnez des interlocuteurs"
            variant="outlined"
            label="Interlocuteurs"
            fullWidth
          />
        )}
        renderTags={(value: readonly InterlocutorOption[], getTagProps) =>
          value.map((option: InterlocutorOption, index: number) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                variant="outlined"
                color="primary"
                label={`${option.firstName} ${option.lastName}`}
                {...tagProps}
                sx={{ fontWeight: 500, borderRadius: 2 }}
              />
            );
          })
        }
        renderOption={(props, option) => (
          <li {...props}>
            {option.inputValue ? (
              <Box display="flex" alignItems="center" color="primary.main">
                <PersonAddAlt1Rounded sx={{ mr: 1.5 }} fontSize="small" />
                <Typography fontWeight={600}>{option.firstName}</Typography>
              </Box>
            ) : (
              <Typography>{`${option.firstName} ${option.lastName}`}</Typography>
            )}
          </li>
        )}
      />

      <Collapse in={showForm}>
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Typography variant="subtitle2" color="primary.main" fontWeight={700} mb={2}>
            Nouvel interlocuteur
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="Prénom"
                value={formValues.firstName}
                onChange={(e) =>
                  setFormValues({ ...formValues, firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="Nom"
                value={formValues.lastName}
                onChange={(e) =>
                  setFormValues({ ...formValues, lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                label="Rôle / Poste (optionnel)"
                value={formValues.role}
                onChange={(e) =>
                  setFormValues({ ...formValues, role: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <CompanyPicker
                onCompanySelect={(id) =>
                  setFormValues({ ...formValues, companyId: id })
                }
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1} mt={1}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => setShowForm(false)}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                onClick={handleFormSubmit}
                disabled={!formValues.firstName || !formValues.lastName}
                sx={{ textTransform: "none", fontWeight: 600, px: 3, borderRadius: 2 }}
              >
                Enregistrer
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default InterlocutorsPicker;

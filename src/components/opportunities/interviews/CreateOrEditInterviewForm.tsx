import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Container,
  Box,
  TextField,
  Button,
  MenuItem,
  TextareaAutosize,
  Typography,
  Grid,
} from "@mui/material";
import {
  Interview,
  InterviewType,
  MeetingConditions,
} from "../../../models/opportunities/Opportunity";
import InterlocutorsPicker from "../../interlocutors/InterlocutorsPicker";
import { useDispatch } from "react-redux";
import {
  createInterview,
  updateInterview,
  updateOpportunityInterviewInterlocutors,
} from "../../../store/slices/opportunitySlice";

interface CreateOrEditInterviewFormProps {
  opportunityId: string;
  interview?: Interview;
  onSubmit: () => void;
}

const CreateOrEditInterviewForm = ({
  opportunityId,
  interview,
  onSubmit,
}: CreateOrEditInterviewFormProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [showCustomType, setShowCustomType] = useState(
    interview && interview.type === InterviewType.Other
  );

  const [_interview, setInterview] = useState<Interview>(
    interview
      ? { ...interview }
      : {
          dueDate: new Date(),
          interviewers: [],
          type: InterviewType.HR,
          meetingCondition: MeetingConditions.Physical,
        }
  );

  const [associatedInterlocutors, setAssociatedInterlocutors] = useState<
    string[]
  >(interview?.interviewers.map(c=> c.id) ?? []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let interviewResultAction;

    if (!interview) {
      interviewResultAction = await dispatch(
         createInterview({ opportunityId: opportunityId, interview: _interview })
      );
    } else {
      interviewResultAction = await dispatch(
        updateInterview({ opportunityId: opportunityId, interview: _interview })
      );
    }

    if (
      createInterview.fulfilled.match(interviewResultAction) ||
      updateInterview.fulfilled.match(interviewResultAction)
    ) {
      await dispatch(
        updateOpportunityInterviewInterlocutors({
          opportunityId: opportunityId,
          interviewId: interviewResultAction.payload.interview.id!, 
          interlocutorsIds: associatedInterlocutors,
        })
      );
    }

    onSubmit();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInterview((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterlocutorSelectionChange = (interlocutorIds: string[]) => {
    setAssociatedInterlocutors(interlocutorIds);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
        <Typography variant="body2" color="text.secondary" mb={3}>
          Complétez les informations pour {interview ? "modifier cet" : "planifier un nouvel"} entretien.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={showCustomType ? 6 : 12}>
            <TextField
              select
              id="type"
              name="type"
              value={_interview.type}
              label="Type d'entretien"
              variant="outlined"
              fullWidth
              onChange={(e) => {
                handleInputChange(e);
                setShowCustomType(e.target.value === InterviewType.Other);
              }}
            >
              {Object.values(InterviewType).map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`interviewType.${type}`)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          {showCustomType && (
            <Grid item xs={12} sm={6}>
              <TextField
                id="customType"
                name="customType"
                value={_interview.customType || ""}
                label="Précisez le type"
                variant="outlined"
                fullWidth
                onChange={handleInputChange}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              fullWidth
              select
              id="meetingCondition"
              name="meetingCondition"
              value={_interview.meetingCondition}
              label="Méthode d'entretien"
              onChange={handleInputChange}
            >
              {Object.values(MeetingConditions).map((condition) => (
                <MenuItem key={condition} value={condition}>
                  {t(`meetingConditions.${condition}`)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              id="dueDate"
              label="Date et Heure"
              type="datetime-local"
              name="dueDate"
              value={
                _interview.dueDate
                  ? new Date(_interview.dueDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                setInterview((prev) => ({
                  ...prev,
                  dueDate: new Date(e.target.value),
                }));
              }}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <InterlocutorsPicker
              preselectedInterlocutors={associatedInterlocutors}
              onInterlocutorsSelectionChange={handleInterlocutorSelectionChange}
              canCreate
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              multiline
              minRows={4}
              placeholder="Ajoutez des notes ou des consignes pour cet entretien..."
              name="freeNotes"
              id="freeNotes"
              fullWidth
              variant="outlined"
              value={_interview.freeNotes || ""}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
          <Button
            variant="text"
            color="inherit"
            onClick={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            Annuler
          </Button>
          <Button
            color="primary"
            type="submit"
            variant="contained"
            sx={{
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(27, 44, 191, 0.2)",
            }}
          >
            {interview ? "Enregistrer" : "Planifier"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateOrEditInterviewForm;

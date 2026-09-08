import React from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import LensRoundedIcon from "@mui/icons-material/LensRounded";
import { EOpportunityState } from "../../../models/opportunities/Opportunity";

const stepPhases = {
  Candidature: [EOpportunityState.APPLIED],
  "Entretien(s)": [EOpportunityState.INTERVIEWING],
  "Proposition(s)": [EOpportunityState.NEGOCIATION_ON_OFFERS],
  Signature: [EOpportunityState.VALIDATED, EOpportunityState.REFUSED],
  Archivé: [EOpportunityState.ABORTED, EOpportunityState.ARCHIVED],
};

const getCurrentStepIndex = (currentPhase: EOpportunityState) => {
  const stepsKeys = Object.keys(stepPhases);
  return stepsKeys.findIndex((step) =>
    (stepPhases as any)[step].includes(currentPhase)
  );
};

const isStepFailed = (step: string, currentPhase: EOpportunityState) => {
  return (
    (step === "Signature" && currentPhase === EOpportunityState.REFUSED) ||
    (step === "Archivé" && currentPhase === EOpportunityState.ABORTED)
  );
};

// Custom Connector
const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: "calc(-50% + 16px)",
    right: "calc(50% + 16px)",
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const QontoStepIconRoot = styled("div")<{
  ownerState: { active?: boolean; completed?: boolean; error?: boolean };
}>(({ theme, ownerState }) => ({
  color: theme.palette.mode === "dark" ? theme.palette.grey[700] : "#eaeaf0",
  display: "flex",
  height: 22,
  alignItems: "center",
  ...(ownerState.active && {
    color: theme.palette.primary.main,
  }),
  ...(ownerState.completed && {
    color: theme.palette.primary.main,
  }),
  ...(ownerState.error && {
    color: theme.palette.error.main,
  }),
}));

function QontoStepIcon(props: any) {
  const { active, completed, className, error } = props;

  return (
    <QontoStepIconRoot ownerState={{ active, completed, error }} className={className}>
      {error ? (
        <CancelRoundedIcon sx={{ fontSize: 28 }} />
      ) : completed ? (
        <CheckCircleRoundedIcon sx={{ fontSize: 28 }} />
      ) : active ? (
        <LensRoundedIcon sx={{ fontSize: 28 }} />
      ) : (
        <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 28 }} />
      )}
    </QontoStepIconRoot>
  );
}

interface PhaseStepperProps {
  currentPhase: EOpportunityState;
}

const PhaseStepper: React.FC<PhaseStepperProps> = ({ currentPhase }) => {
  const stepsKeys = Object.keys(stepPhases);
  const activeStep = getCurrentStepIndex(currentPhase);

  return (
    <Box sx={{ width: "100%", mt: 2, mb: 4 }}>
      <Stepper
        alternativeLabel
        activeStep={activeStep === -1 ? 0 : activeStep}
        connector={<QontoConnector />}
      >
        {stepsKeys.map((label, index) => {
          const failed = isStepFailed(label, currentPhase);
          
          return (
            <Step key={label}>
              <StepLabel
                error={failed}
                StepIconComponent={(props) => (
                  <QontoStepIcon {...props} error={failed} />
                )}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={index === activeStep ? 700 : 500}
                  color={
                    failed
                      ? "error.main"
                      : index === activeStep
                      ? "primary.main"
                      : "text.secondary"
                  }
                >
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default PhaseStepper;

import React from "react";
import {
  Card,
  Typography,
  Box,
  Avatar,
  IconButton,
  Rating,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Opportunity from "../../models/opportunities/Opportunity";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Circle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateOpportunity } from "../../store/slices/opportunitySlice";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const handleNavOpportunity = (id: string) => {
    navigate(opportunity.id!);
  };

  const handleRatingChange = (event, newValue) => {
    const safeOpportunity = {
      ...opportunity,
      userAppreciationLevel: newValue,
    };

    dispatch(updateOpportunity({ opportunity: safeOpportunity }));
  };
  const opportunityCompany = useSelector((state: RootState) =>
    state.companies.companies.find((c) => c.id == opportunity.companyId)
  );

  const companyName = opportunityCompany?.name ?? "Enseigne";

  return (
    <Card
      sx={{
        mb: 2,
        display: "flex",
        alignItems: "center",
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2.5,
        boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          transform: "translateY(-2px)"
        }
      }}
      key={opportunity.id}
    >
      <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
        <Grid onClick={() => handleNavOpportunity(opportunity.id!)} item xs={12} sm={7} md={8} display="flex" alignItems="center" sx={{ cursor: 'pointer' }}>
          <Avatar
            alt={companyName}
            src={opportunityCompany?.websiteUrl}
            sx={{ width: {xs: 48, sm: 60}, height: {xs: 48, sm: 60}, mr: 2, flexShrink: 0 }}
          />
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", minWidth: 0, gap: 1 }}>
            <Typography
              noWrap
              fontWeight={600}
              variant="h6"
              color="secondary"
              sx={{
                fontSize: {xs: "1rem", sm: "1.1rem"},
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                opportunity.companyId
                  ? navigate(`/sheets/companies/${opportunity.companyId}`)
                  : undefined;
              }}
            >
              {companyName}
            </Typography>
            <Circle color="primary" sx={{ fontSize: "6px", display: {xs: "none", sm: "block"} }} />
            <Typography
              noWrap
              fontWeight={700}
              variant="h6"
              color="primary"
              sx={{ fontSize: {xs: "1rem", sm: "1.2rem"}, width: {xs: "100%", sm: "auto"} }}
            >
              {opportunity.roleTitle}
            </Typography>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sm={5}
          md={4}
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
          gap={2}
          sx={{ mt: { xs: 1, sm: 0 } }}
        >
          <Box display="flex" flexDirection="column" alignItems={{ xs: "flex-start", sm: "flex-end" }}>
            <Rating
              size="small"
              name="simple-controlled"
              precision={1}
              value={opportunity.userAppreciationLevel || 0}
              onChange={handleRatingChange}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              Modifié le {new Date(opportunity.lastUpdateDate).toLocaleDateString()}
            </Typography>
          </Box>
          <IconButton
            color="secondary"
            size="small"
            onClick={() => handleNavOpportunity(opportunity.id!)}
            sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Grid>
      </Grid>
    </Card>
  );
};

export default OpportunityCard;

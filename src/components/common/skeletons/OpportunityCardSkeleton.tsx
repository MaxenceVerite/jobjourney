import React from "react";
import { Card, Grid, Skeleton, Box } from "@mui/material";

interface OpportunityCardSkeletonProps {
  count?: number;
}

export const OpportunityCardSkeleton: React.FC<OpportunityCardSkeletonProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          sx={{
            height: "12vh",
            minHeight: "90px",
            mb: 2,
            display: "flex",
            alignItems: "center",
            px: 4,
            py: 3,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={6} display="flex" alignItems="center">
              <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2, flexShrink: 0 }} />
              <Box sx={{ width: "65%" }}>
                <Skeleton variant="text" width="50%" height={26} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="80%" height={20} />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
            >
              <Skeleton variant="rectangular" width={110} height={24} sx={{ borderRadius: 1, mr: 2 }} />
              <Skeleton variant="text" width={120} height={20} sx={{ mr: 2 }} />
              <Skeleton variant="circular" width={36} height={36} />
            </Grid>
          </Grid>
        </Card>
      ))}
    </>
  );
};

export default OpportunityCardSkeleton;

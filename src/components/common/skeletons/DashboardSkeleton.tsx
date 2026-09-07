import React from "react";
import { Grid, Card, Skeleton, Box } from "@mui/material";

export const DashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      {/* Metrics Row */}
      <Grid container spacing={3} mb={4}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
              <Skeleton variant="text" width="40%" height={48} />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            </Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={70} sx={{ borderRadius: 1.5, mb: 2 }} />
            ))}
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1.5, mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1.5 }} />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;

import React from "react";
import { Card, Grid, Skeleton, Box } from "@mui/material";

interface DocumentCardSkeletonProps {
  count?: number;
}

export const DocumentCardSkeleton: React.FC<DocumentCardSkeletonProps> = ({ count = 4 }) => {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid key={index} item xs={6} md={2} marginY={2}>
          <Card
            sx={{
              height: 260,
              minWidth: 80,
              margin: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderRadius: 2,
              boxShadow: "5px 10px 15px rgba(0,0,0,0.05)",
            }}
          >
            <Skeleton variant="rectangular" width="85%" height={140} sx={{ borderRadius: 1.5, mt: 1 }} />
            <Box sx={{ width: "100%", px: 1, mb: 1 }}>
              <Skeleton variant="text" width="90%" height={22} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="60%" height={16} />
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default DocumentCardSkeleton;

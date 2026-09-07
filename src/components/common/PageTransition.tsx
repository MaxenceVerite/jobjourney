import React from 'react';
import { Box } from '@mui/material';

interface PageTransitionProps {
  children: React.ReactNode;
  locationKey?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, locationKey }) => {
  return (
    <Box
      key={locationKey}
      sx={{
        animation: 'pageFadeIn 0.25s ease-out',
        '@keyframes pageFadeIn': {
          '0%': {
            opacity: 0,
          },
          '100%': {
            opacity: 1,
          },
        },
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
};

export default PageTransition;

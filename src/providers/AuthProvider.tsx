import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { checkSession as checkSessionAction } from '../store/slices/authSlice';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getAccessToken, getRefreshToken } from '../api/myJobBoard/tokenManager';

export const AuthContext = React.createContext({});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setLoading] = useState(true);
  const dispatch = useDispatch<any>();
  
  useEffect(() => {
    const checkSession = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      // If user has no saved tokens, they are not logged in: skip network request immediately!
      if (!accessToken && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        await dispatch(checkSessionAction());
      } catch (error) {
        console.error("Session check error", error);
      } finally {
        setLoading(false);
      }
    };
   
    checkSession();
  }, [dispatch]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Vérification de la session...
        </Typography>
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

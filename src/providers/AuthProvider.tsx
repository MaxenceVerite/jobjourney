// src/providers/AuthProvider.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { checkSession as checkSessionAction } from '../store/slices/authSlice';
import { Box, CircularProgress } from '@mui/material';

export const AuthContext = React.createContext({});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setLoading] = useState(true);
  const dispatch = useDispatch<any>();
  
  useEffect(() => {
    const checkSession = async () => {
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
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress />
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

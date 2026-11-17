import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { checkSession as checkSessionAction, setConnected } from '../store/slices/authSlice';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getAccessToken, getRefreshToken, clearTokens, isTokenExpired } from '../api/myJobBoard/tokenManager';

export const AuthContext = React.createContext({});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setLoading] = useState(true);
  const dispatch = useDispatch<any>();
  
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      // Cas 1: Aucun token -> Déconnecté immédiatement (0ms)
      if (!accessToken && !refreshToken) {
        setLoading(false);
        return;
      }

      // Cas 2: Token d'accès existant et valide localement
      // L'utilisateur est connecté immédiatement sans attendre le réveil de Render
      if (accessToken && !isTokenExpired(accessToken)) {
        dispatch(setConnected(true));
        setLoading(false);
        // Vérification silencieuse en arrière-plan sans bloquer l'interface
        dispatch(checkSessionAction()).catch(() => {});
        return;
      }

      // Cas 3: Token expiré, mais un refresh token existe
      // On attend au maximum 4 secondes pour rafraîchir la session
      if (refreshToken) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 4000)
          );
          await Promise.race([dispatch(checkSessionAction()), timeoutPromise]);
        } catch {
          clearTokens();
        } finally {
          setLoading(false);
        }
        return;
      }

      // Cas 4: Token expiré et aucun refresh token -> Nettoyage immédiat (0ms)
      clearTokens();
      setLoading(false);
    };

    initAuth();
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
          Chargement de Job Journey...
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

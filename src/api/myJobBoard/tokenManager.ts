



// Fonction pour obtenir le token depuis le localStorage
const getAccessToken = (): string | null => localStorage.getItem("myjobboard_accesstoken");

// Fonction pour définir le token dans le localStorage
const setAccessToken = (token: string) => localStorage.setItem("myjobboard_accesstoken", token);

// Fonction pour obtenir le refreshToken depuis le localStorage
const getRefreshToken = (): string | null => localStorage.getItem("myjobboard_refreshtoken");

// Fonction pour définir le refreshToken dans le localStorage
const setRefreshToken = (refreshToken: string) =>
  localStorage.setItem("myjobboard_refreshtoken", refreshToken);

// Supprime tous les tokens lors de la déconnexion ou expiration
const clearTokens = () => {
  localStorage.removeItem("myjobboard_accesstoken");
  localStorage.removeItem("myjobboard_refreshtoken");
  localStorage.removeItem("user");
};

// Vérifie si un token JWT est expiré localement (0ms sans requête réseau)
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // Expiré si la date actuelle dépasse la date d'expiration (avec 30s de marge de sécurité)
    return Date.now() >= (payload.exp * 1000) - 30000;
  } catch {
    return true;
  }
};

export {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  isTokenExpired,
};
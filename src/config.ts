// src/config.ts
interface Config {
    apiUrl: string;
  }
  
  const developmentConfig: Config = {
    apiUrl: 'http://localhost:5200/', // URL pour l'environnement de développement
  };
  
  const productionConfig: Config = {
    apiUrl: 'https://job-journey-1u0a.onrender.com/', // URL pour l'environnement de production
  };
  
  // Utilise import.meta.env avec Vite
  const isProduction = import.meta.env.MODE === 'production';
  const config: Config = isProduction ? productionConfig : developmentConfig;
  
  export default config;
  
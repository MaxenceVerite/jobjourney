import axios from "axios";
import config from "../../config";
import { refresh as refreshTokenApi } from "../myJobBoard/authentication/authenticationApi";
import {getAccessToken, getRefreshToken} from "./tokenManager";


const apiClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  timeout: 15000,
});

// Interceptor de requête pour ajouter le token à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    
    const originalRequest = error.config;

    if (originalRequest._isRetry) {
      return Promise.reject(error);
    }

    originalRequest._isRetry = true;

    if (
      !error.response ||
      originalRequest.url.includes("/refresh") ||
      error.response.status != 401
    )
      return Promise.reject(error);

    const sessionExpiredError = {...error, sessionExpired: true}
    const refreshToken = getRefreshToken();

    if (!refreshToken) return Promise.reject(sessionExpiredError);

    try {
      await refreshTokenApi(refreshToken).then((data) => {
  
        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      });
    } catch (error) {
      return Promise.reject(sessionExpiredError);

    }

  }
);

export default apiClient;

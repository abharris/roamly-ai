import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { router } from 'expo-router';
import { ROUTES } from '../constants/routes';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

if (__DEV__) {
  apiClient.interceptors.request.use((config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}

// 429 handling (always active) + __DEV__ logging
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (__DEV__) console.log(`[API] ERROR ${error.response?.status} ${error.config?.url}`, error.response?.data);
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return Promise.reject(
        new Error(
          retryAfter
            ? `Too many requests. Try again in ${retryAfter} seconds.`
            : 'Too many requests. Please slow down.'
        )
      );
    }
    return Promise.reject(error);
  }
);

// Attach Cognito ID token to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Not signed in — let the request proceed without a token (will get 401)
  }
  return config;
});

// On 401, refresh token once and retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const session = await fetchAuthSession({ forceRefresh: true });
        const token = session.tokens?.idToken?.toString();
        if (!token) {
          router.replace(ROUTES.auth);
          return Promise.reject(error);
        }
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch {
        // Refresh token expired — force re-login
        router.replace(ROUTES.auth);
      }
    }
    return Promise.reject(error);
  }
);

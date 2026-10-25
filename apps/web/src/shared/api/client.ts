import axios, { type InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

type RetriableRequest = InternalAxiosRequestConfig & { authRetry?: boolean };

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && !config.headers.Authorization) {
    const token = window.sessionStorage.getItem('nutrilog_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    return Promise.reject(error);
  }

  const request = error.config as RetriableRequest;
  if (
    typeof window === 'undefined'
    || request.authRetry
    || request.url?.startsWith('/auth/')
  ) {
    return Promise.reject(error);
  }

  request.authRetry = true;
  try {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh');
    window.sessionStorage.setItem('nutrilog_access_token', data.accessToken);
    window.dispatchEvent(new CustomEvent('nutrilog:token-refreshed', { detail: data.accessToken }));
    request.headers.Authorization = `Bearer ${data.accessToken}`;
    return await apiClient(request);
  } catch (refreshError) {
    window.sessionStorage.removeItem('nutrilog_access_token');
    window.dispatchEvent(new Event('nutrilog:session-expired'));
    return Promise.reject(refreshError);
  }
});

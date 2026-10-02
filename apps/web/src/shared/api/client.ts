import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

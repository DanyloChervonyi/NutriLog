import { apiClient } from './client';

export type AuthResponse = Readonly<{
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: Readonly<{ id: string; email: string }>;
}>;

export async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiClient.post<T>(`/auth${path}`, body);
  return data;
}

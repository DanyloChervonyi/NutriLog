import { apiClient } from './client';

export type AuthResponse = Readonly<{
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: Readonly<{ id: string; username: string; email: string | null; role: 'USER' | 'MODERATOR' | 'ADMIN' }>;
}>;

export async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiClient.post<T>(`/auth${path}`, body);
  return data;
}

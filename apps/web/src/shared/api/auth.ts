export type AuthResponse = Readonly<{
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: Readonly<{ id: string; email: string }>;
}>;

const authBaseUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth`;

export async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${authBaseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Request failed');
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function saveAccessToken(token: string): void {
  window.sessionStorage.setItem('nutrilog_access_token', token);
}

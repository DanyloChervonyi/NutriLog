'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = Readonly<{
  accessToken: string | null;
  ready: boolean;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useQueryClient();
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialize = () => {
      setTokenState(window.sessionStorage.getItem('nutrilog_access_token'));
      setReady(true);
    };
    Promise.resolve().then(initialize);

    const handleTokenRefresh = (event: Event) => {
      const token = (event as CustomEvent<string>).detail;
      if (typeof token === 'string') setTokenState(token);
    };
    const handleSessionExpired = () => {
      queryClient.clear();
      setTokenState(null);
    };

    window.addEventListener('nutrilog:token-refreshed', handleTokenRefresh);
    window.addEventListener('nutrilog:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('nutrilog:token-refreshed', handleTokenRefresh);
      window.removeEventListener('nutrilog:session-expired', handleSessionExpired);
    };
  }, [queryClient]);

  const setAccessToken = useCallback((token: string) => {
    window.sessionStorage.setItem('nutrilog_access_token', token);
    queryClient.clear();
    setTokenState(token);
    setReady(true);
  }, [queryClient]);

  const clearAccessToken = useCallback(() => {
    window.sessionStorage.removeItem('nutrilog_access_token');
    queryClient.clear();
    setTokenState(null);
    setReady(true);
  }, [queryClient]);

  const value = useMemo(
    () => ({ accessToken, ready, setAccessToken, clearAccessToken }),
    [accessToken, clearAccessToken, ready, setAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

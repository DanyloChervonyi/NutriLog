'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = Readonly<{
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}>;

const STORAGE_KEY = 'nutrilog-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    try {
      const storedPreference = localStorage.getItem(STORAGE_KEY);
      const initialPreference = isThemePreference(storedPreference) ? storedPreference : 'system';
      setPreferenceState(initialPreference);
      document.documentElement.dataset.theme = initialPreference;
    } catch {
      document.documentElement.dataset.theme = 'system';
    }
  }, []);

  const setPreference = (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    document.documentElement.dataset.theme = nextPreference;

    try {
      localStorage.setItem(STORAGE_KEY, nextPreference);
    } catch {
      // The current page still uses the selected theme when storage is unavailable.
    }
  };

  return <ThemeContext.Provider value={{ preference, setPreference }}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemePreference must be used inside ThemeProvider');
  return context;
}

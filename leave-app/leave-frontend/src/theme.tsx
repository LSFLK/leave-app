import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';

type ThemeCtx = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

const ThemeModeContext = createContext<ThemeCtx | undefined>(undefined);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem('theme-mode')) as PaletteMode | null;
    if (saved === 'dark' || saved === 'light') setMode(saved);
  }, []);

  const toggleTheme = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') window.localStorage.setItem('theme-mode', next);
      return next;
    });
  };

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  const value = useMemo(() => ({ mode, toggleTheme }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}

'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

export type AppMode = 'emas_tua' | 'emas_muda';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isLoading: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('emas_tua');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored mode in cookies on initial load
    const storedMode = Cookies.get('appMode') as AppMode;
    if (storedMode && (storedMode === 'emas_tua' || storedMode === 'emas_muda')) {
      setModeState(storedMode);
    }
    setIsLoading(false);
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    Cookies.set('appMode', newMode, {
      expires: 30, // Cookie expires in 30 days
      secure: process.env.NODE_ENV === 'production',
    });
  };

  return <AppModeContext.Provider value={{ mode, setMode, isLoading }}>{children}</AppModeContext.Provider>;
}

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};

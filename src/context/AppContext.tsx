/**
 * Global application context.
 * Fetches datasets and models ONCE, then shares them across all screens.
 * Screens no longer need to re-fetch on every mount.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Dataset, Model } from '../types';

interface AppContextType {
  datasets: Dataset[];
  models: Model[];
  isLoading: boolean;
  refreshDatasets: () => Promise<void>;
  refreshModels: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDatasets = useCallback(async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  }, []);

  const refreshModels = useCallback(async () => {
    try {
      const data = await api.getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([refreshDatasets(), refreshModels()]);
    setIsLoading(false);
  }, [refreshDatasets, refreshModels]);

  // Fetch everything once on app boot
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <AppContext.Provider value={{ datasets, models, isLoading, refreshDatasets, refreshModels, refreshAll }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { electronAPI } from '../utils';

interface FeatureSettings {
  timeline: boolean;
  caseboard: boolean;
}

interface AppSettings {
  retentionDays: number;
  features: FeatureSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isFeatureEnabled: (feature: keyof FeatureSettings) => boolean;
  loading: boolean;
}

const defaultSettings: AppSettings = {
  retentionDays: 7,
  features: {
    timeline: false,
    caseboard: false,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await electronAPI.getSettings();
      setSettings({
        retentionDays: loadedSettings.retentionDays || 7,
        features: loadedSettings.features || {
          timeline: false,
          caseboard: false,
        },
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await electronAPI.setSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const isFeatureEnabled = (feature: keyof FeatureSettings): boolean => {
    return settings.features[feature];
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    isFeatureEnabled,
    loading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

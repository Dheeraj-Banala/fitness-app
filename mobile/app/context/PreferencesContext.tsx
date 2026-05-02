import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../services/api';

type Prefs = {
  weightUnit: 'kg' | 'lbs';
  volumeUnit: 'ml' | 'oz';
  heightUnit: 'cm' | 'ft_in';
  reload: () => void;
};

const PreferencesContext = createContext<Prefs>({
  weightUnit: 'lbs',
  volumeUnit: 'oz',
  heightUnit: 'ft_in',
  reload: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [volumeUnit, setVolumeUnit] = useState<'ml' | 'oz'>('oz');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('ft_in');

  async function load() {
    if (!token) return;
    try {
      const data = await apiFetch('/users/me', token);
      setWeightUnit(data.weight_unit ?? 'lbs');
      setVolumeUnit(data.volume_unit ?? 'oz');
      setHeightUnit(data.height_unit ?? 'ft_in');
    } catch (e) {}
  }

  useEffect(() => { load(); }, [token]);

  return (
    <PreferencesContext.Provider value={{ weightUnit, volumeUnit, heightUnit, reload: load }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

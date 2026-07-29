import React, { createContext, useContext, useState, useEffect } from 'react';

export type BusinessSettings = {
  company_name: string;
  tin: string;
  address: string;
  permit_number: string;
  ptu_date: string;
  pos_sn: string;
  min: string;
  business_style: string;
  service_charge_percentage?: number;
  report_start_time?: string;
  report_end_time?: string;
  service_charge_basis?: 'vat_exclusive' | 'gross';
  strict_item_locked?: boolean;
};

type SettingsContextType = {
  settings: BusinessSettings | null;
  refreshSettings: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings)
      .catch(console.error);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

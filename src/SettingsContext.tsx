import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBranch } from './BranchContext';
import { getStaffToken, LOGIN_EVENT } from './lib/staffSession';

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
  const { activeBranch } = useBranch();

  const fetchSettings = () => {
    const url = activeBranch ? `/api/settings?branch_id=${activeBranch.id}` : '/api/settings';
    if (!getStaffToken()) return; // settings need a staff login
    fetch(url)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data) && !data.error) setSettings(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSettings();
    window.addEventListener(LOGIN_EVENT, fetchSettings);
    return () => window.removeEventListener(LOGIN_EVENT, fetchSettings);
  }, [activeBranch]);

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

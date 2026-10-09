import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStaffToken, LOGIN_EVENT } from './lib/staffSession';

export type Branch = { id: number; name: string; address: string; is_bir_compliant: boolean };

interface BranchContextType {
  branches: Branch[];
  activeBranch: Branch | null;
  setActiveBranch: (b: Branch) => void;
  isLoading: boolean;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType>({} as any);

export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranches = async (): Promise<Branch[]> => {
    // Branches need a staff login; before login (or on an error reply) use an empty list
    if (!getStaffToken()) {
      setBranches([]);
      return [];
    }
    try {
      const res = await fetch('/api/branches');
      const data = res.ok ? await res.json() : [];
      const list: Branch[] = Array.isArray(data) ? data : [];
      setBranches(list);
      return list;
    } catch {
      setBranches([]);
      return [];
    }
  };

  const loadBranches = () =>
    fetchBranches().then(data => {
      if (data.length > 0) {
        // Try to restore from localStorage
        const saved = localStorage.getItem('activeBranchId');
        if (saved) {
          const found = data.find((b: Branch) => b.id === parseInt(saved));
          if (found) {
            setActiveBranch(found);
            setIsLoading(false);
            return;
          }
        }
        setActiveBranch(data[0]);
      } else {
        setActiveBranch(null);
      }
      setIsLoading(false);
    });

  useEffect(() => {
    loadBranches();
    // Load again as soon as someone logs in on this device
    window.addEventListener(LOGIN_EVENT, loadBranches);
    return () => window.removeEventListener(LOGIN_EVENT, loadBranches);
  }, []);

  const refreshBranches = async () => {
    const data = await fetchBranches();
    // If active branch was deleted, reset it
    if (activeBranch && !data.find((b: Branch) => b.id === activeBranch.id)) {
      if (data.length > 0) {
        handleSetActiveBranch(data[0]);
      } else {
        setActiveBranch(null);
        localStorage.removeItem('activeBranchId');
      }
    }
  };

  const handleSetActiveBranch = (b: Branch) => {
    setActiveBranch(b);
    localStorage.setItem('activeBranchId', b.id.toString());
  };

  return (
    <BranchContext.Provider value={{ branches, activeBranch, setActiveBranch: handleSetActiveBranch, isLoading, refreshBranches }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);

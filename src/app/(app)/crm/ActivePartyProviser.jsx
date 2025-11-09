//src/app/crm/ActivePartyProviser.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'crm.activeParty';

// Create the context
const ActivePartyCtx = createContext(undefined);

// Provider component
export function ActivePartyProvider({ children }) {
  const [activeParty, setActiveParty] = useState(null);
  const pathname = usePathname();

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
        // console.log("Hydrating activeParty from sessionStorage:", stored);
      try {
        setActiveParty(JSON.parse(stored));
      } catch {
        setActiveParty(null);
      }
    }
  }, []);

  // Persist to sessionStorage on change
  useEffect(() => {
    if (activeParty !== null) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activeParty));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [activeParty]);

  useEffect(() => {
    if (pathname !== '/crm/parties/view' && pathname !== '/crm/parties/edit') {
      setActiveParty(null);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [pathname]);

  const clearActiveParty = () => setActiveParty(null);

  return (
    <ActivePartyCtx.Provider
      value={{
        activeParty,
        setActiveParty,
        clearActiveParty,
      }}
    >
      {children}
    </ActivePartyCtx.Provider>
  );
}

// Hook to use the context
export function useActiveParty() {
  const ctx = useContext(ActivePartyCtx);
  if (!ctx) {
    throw new Error('useActiveParty must be used within an ActivePartyProvider');
  }
  return ctx;
}
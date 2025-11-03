'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const NavListContext = createContext(null);

export function useNavList() {
  const ctx = useContext(NavListContext);
  if (!ctx) throw new Error('useNavList must be used inside NavListProvider');
  return ctx; // { navList, addLink, setNavList }
}

export function NavListProvider({ children }) {
  const [navList, setNavList] = useState([
    { href: '/manufacturing/campaigns/create', name: 'Start New campaigns' },
  ]);

  const addLink = useCallback((link) => {
    setNavList(prev => (prev.some(l => l.href === link.href) ? prev : [link, ...prev,]));
  }, []);

  const removeLink = useCallback((href) => {
    setNavList(prev => prev.filter(l => l.href !== href));
  }, []);

  const value = useMemo(() => ({
    navList,
    setNavList,
    addLink,
    removeLink,
  }), [navList, setNavList, addLink, removeLink]);

  return (
    <NavListContext.Provider value={value}>
      {children}
    </NavListContext.Provider>
  );
}
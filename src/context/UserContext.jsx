// src/app/context/UserContext.jsx
'use client'
import { axiosInstance } from '@/lib/axiosInstance';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserContext = createContext();
const SESSION_KEY = 'userContextData';

const defaultUserState = {
  userId: null,
  companyId: null,
  role: null,
  companyName: null,
  userName: null,
  enabledModules: [],
  permissions: [],
};

const PERSISTED_KEYS = Object.keys(defaultUserState);

// 1. Define a function to get the initial state from storage
const getInitialState = () => {
    if (typeof window !== 'undefined') {
        const stored = window.sessionStorage.getItem(SESSION_KEY);
        if (stored) {
            try {
                return { ...defaultUserState, ...JSON.parse(stored) };
            } catch (e) {
                console.error("Failed to parse user context from session storage:", e);
            }
        }
    }
    // For both SSR and initial client render, return the default state
    return defaultUserState;
};

export const UserProvider = ({ children }) => {
  // 2. Initialize with the default state on both server and client
  const [userState, setUserState] = useState(defaultUserState);
  const [permissionsNeedsRefresh, setPermissionsNeedsRefresh] = useState(false);
  
  // 3. Add a state to track if we're mounted on the client
  const [isMounted, setIsMounted] = useState(false); 

  // --- HYDRATION FIX: Read client-only data in useEffect ---
  useEffect(() => {
    // This runs only on the client after initial render (hydration)
    const storedState = getInitialState();
    setUserState(storedState);
    setIsMounted(true);
  }, []);

  // --- SIDE EFFECT: Save to sessionStorage on state change ---
  useEffect(() => {
    // Only save once the component has successfully mounted and hydrated
    if (isMounted) { 
      const dataToStore = PERSISTED_KEYS.reduce((acc, key) => {
        acc[key] = userState[key];
        return acc;
      }, {});
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(dataToStore));
    }
  }, [userState, isMounted]); // Dependency on isMounted ensures we don't save during the initial client-side update

  // ... (Keep your useCallback setters and context logic the same) ...
  
  const setUserId = useCallback((userId) => setUserState(s => ({ ...s, userId })), []);
  const setCompanyId = useCallback((companyId) => setUserState(s => ({ ...s, companyId })), []);
  const setRole = useCallback((role) => {
    setUserState(s => ({ ...s, role }));
    setPermissionsNeedsRefresh(true);
  }, []);
  const setCompanyName = useCallback((companyName) => setUserState(s => ({ ...s, companyName })), []);
  const setUserName = useCallback((userName) => setUserState(s => ({ ...s, userName })), []);
  const setEnabledModules = useCallback((enabledModules) => setUserState(s => ({ ...s, enabledModules })), []);
  const setPermissions = useCallback((permissions) => setUserState(s => ({ ...s, permissions })), []);
  const setUserContext = useCallback((updates) => {
    setUserState(s => ({ ...s, ...updates }));
  }, []);
  const clearUserContext = useCallback(() => {
    setUserState(defaultUserState);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {
        console.error('Failed to clear user context storage:', e);
      }
    }
  }, []);

  const markPermissionsForRefresh = useCallback(() => {
    setPermissionsNeedsRefresh(true);
  }, []);

  // Auto-refresh permissions when flagged
  useEffect(() => {
    if (!isMounted) return;
    if (!permissionsNeedsRefresh) return;

    let cancelled = false;

    const loadPermissions = async () => {
      try {
        // Fetch role permissions
        console.log('Fetching role permissions...');
        const res = await axiosInstance.get('/api/permissions/by-role');
        console.log('Role permissions:', res);
        if (!res?.data?.status) {
          throw new Error('Failed to load role permissions');
        }
        // const json = await res.json();
        const keys = res.data?.permissions || [];
        console.log('Role permissions cancelled:', cancelled);
        if (!cancelled) {
          setPermissions(keys);
        }
      } catch (e) {
        console.error('Role load error:', e);
      } finally {
        if (!cancelled) {
          setPermissionsNeedsRefresh(false);
        }
      }
    };

    loadPermissions();

    return () => {
      cancelled = true;
    };
  }, [isMounted, permissionsNeedsRefresh, setPermissions]);


  const value = {
    ...userState,
    permissionsNeedsRefresh,
    setUserId,
    setCompanyId,
    setRole,
    setCompanyName,
    setUserName,
    setEnabledModules,
    setPermissions,
    markPermissionsForRefresh,
    setUserContext,
    clearUserContext,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
};
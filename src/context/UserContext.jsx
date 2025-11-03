// src/app/context/UserContext.jsx
'use client'
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
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          userId: userState.userId,
          companyId: userState.companyId,
          role: userState.role,
          companyName: userState.companyName,
          userName: userState.userName,
          enabledModules: userState.enabledModules,
          permissions: userState.permissions,
        })
      );
    }
  }, [userState, isMounted]); // Dependency on isMounted ensures we don't save during the initial client-side update

  // ... (Keep your useCallback setters and context logic the same) ...
  
  const setUserId = useCallback((userId) => setUserState(s => ({ ...s, userId })), []);
  const setCompanyId = useCallback((companyId) => setUserState(s => ({ ...s, companyId })), []);
  const setRole = useCallback((role) => setUserState(s => ({ ...s, role })), []);
  const setCompanyName = useCallback((companyName) => setUserState(s => ({ ...s, companyName })), []);
  const setUserName = useCallback((userName) => setUserState(s => ({ ...s, userName })), []);
  const setEnabledModules = useCallback((enabledModules) => setUserState(s => ({ ...s, enabledModules })), []);
  const setPermissions = useCallback((permissions) => setUserState(s => ({ ...s, permissions })), []);
  const setUserContext = useCallback((updates) => {
    setUserState(s => ({ ...s, ...updates }));
  }, []);
  const clearUserContext = useCallback(() => setUserState(defaultUserState), []);


  const value = {
    ...userState,
    user : userState,
    setUserId,
    setCompanyId,
    setRole,
    setCompanyName,
    setUserName,
    setEnabledModules,
    setPermissions,
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
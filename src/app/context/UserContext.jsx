// src/app/context/UserContext.jsx
'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define the shape of the user context
const UserContext = createContext();

const SESSION_KEY = 'userContextData';

const defaultUserState = {
  userId: null,
  companyId: null,
  role: null,
  companyName: null,
  enabledModules: [],
};

export const UserProvider = ({ children }) => {
  // Hydrate from sessionStorage if available
  const [userState, setUserState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          return { ...defaultUserState, ...JSON.parse(stored) };
        } catch (e) {
          // corrupted data, ignore
        }
      }
    }
    return defaultUserState;
  });

  // Save to sessionStorage on change (except tokens)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          userId: userState.userId,
          companyId: userState.companyId,
          role: userState.role,
          companyName: userState.companyName,
          enabledModules: userState.enabledModules,
        })
      );
    }
  }, [userState]);

  // Individual setters for each property
  const setUserId = useCallback((userId) => setUserState(s => ({ ...s, userId })), []);
  const setCompanyId = useCallback((companyId) => setUserState(s => ({ ...s, companyId })), []);
  const setRole = useCallback((role) => setUserState(s => ({ ...s, role })), []);
  const setCompanyName = useCallback((companyName) => setUserState(s => ({ ...s, companyName })), []);
  const setEnabledModules = useCallback((enabledModules) => setUserState(s => ({ ...s, enabledModules })), []);

  // Function to update multiple fields at once
  const setUserContext = useCallback((updates) => {
    setUserState(s => ({ ...s, ...updates }));
  }, []);

  // Function to reset context (e.g. on logout)
  const clearUserContext = useCallback(() => setUserState(defaultUserState), []);

  const value = {
    ...userState,
    setUserId,
    setCompanyId,
    setRole,
    setCompanyName,
    setEnabledModules,
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
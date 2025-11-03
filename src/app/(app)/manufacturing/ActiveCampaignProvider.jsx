'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ActiveCampaignCtx = createContext(null);

export function useActiveCampaign() {
  const ctx = useContext(ActiveCampaignCtx);
  if (!ctx) throw new Error('useActiveCampaign must be used inside ActiveCampaignProvider');
  return ctx; // { activeCampaign, setActiveCampaign, clearActiveCampaign, campaignList, setCampaignList }
}

export function ActiveCampaignProvider({ children }) {
  const STORAGE_KEY = 'manufacturing.activeCampaign';
  const [activeCampaign, setActiveCampaignState] = useState(null);
  const [campaignList, setCampaignList] = useState([]);
  const STORAGE_KEY_LIST = 'manufacturing.campaignList';

  // hydrate from sessionStorage (so it survives route changes and refresh)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setActiveCampaignState(JSON.parse(raw));
    } catch {}
    try {
      const rawList = sessionStorage.getItem(STORAGE_KEY_LIST);
      if (rawList) setCampaignList(JSON.parse(rawList));
    } catch {}
  }, []);

  // persist to sessionStorage
  useEffect(() => {
    try {
      if (activeCampaign) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activeCampaign));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [activeCampaign]);

  useEffect(() => {
    try {
      if (campaignList && campaignList.length) {
        sessionStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(campaignList));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_LIST);
      }
    } catch {}
  }, [campaignList]);

  const setActiveCampaign = (c) => setActiveCampaignState(c ?? null);
  const setList = (c) => setCampaignList(c ?? []);
  const clearActiveCampaign = () => setActiveCampaignState(null);

  // Clear both activeCampaign and campaignList, and remove from sessionStorage
  const clearAllCampaignState = () => {
    setActiveCampaignState(null);
    setCampaignList([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY_LIST);
    } catch {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/manufacturing')) {
        clearAllCampaignState();
      }
    }
  }, []);

  return (
    <ActiveCampaignCtx.Provider value={{ activeCampaign, setActiveCampaign, clearActiveCampaign, campaignList, setList }}>
      {children}
    </ActiveCampaignCtx.Provider>
  );
}
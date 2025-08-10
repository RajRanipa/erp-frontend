// src/app/utils/useIdleTimer.js

import { useEffect, useRef } from 'react';
import { axiosInstance } from '../../lib/axiosInstance';

function logout() {
  try {
    console.log('🔒 Logging out...');
    axiosInstance.post('/logout', {}, { withCredentials: true })
      .then(() => {
        console.log('✅ Logout successful');
        window.location.href = '/login';
      })
      .catch((error) => {
        console.error('❌ Logout error:', error);
      });
  } catch (error) {
    console.error('❌ Unexpected logout failure:', error);
  }
}
export default function useIdleTimer({ timeout = 15 * 60 * 1000}) {
  const timer = useRef(null);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const confirmStay = window.confirm(
        "⏳ You've been inactive for a while. Do you want to stay logged in?"
      );
      if (confirmStay) {
        resetTimer(); // User wants to stay, reset timer
      } else {
        logout(); // Trigger logout or session expiry handler
      }
    }, timeout);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // Initial start

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}

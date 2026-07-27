'use client';

import { useEffect, useRef, useState } from 'react';
import { getActiveRequestCount } from '@/lib/axiosInstance';

const SHOW_DELAY_MS = 160;
const MIN_VISIBLE_MS = 280;

export default function ApiActivityIndicator() {
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(getActiveRequestCount());
  const shownAtRef = useRef(0);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const clearTimers = () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };

    const update = (count) => {
      activeRef.current = count;

      if (count > 0) {
        clearTimeout(hideTimerRef.current);
        clearTimeout(showTimerRef.current);
        showTimerRef.current = setTimeout(() => {
          if (activeRef.current > 0) {
            shownAtRef.current = Date.now();
            setVisible(true);
          }
        }, SHOW_DELAY_MS);
        return;
      }

      clearTimeout(showTimerRef.current);
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAtRef.current));
      hideTimerRef.current = setTimeout(() => setVisible(false), remaining);
    };

    const onActivity = (event) => update(Number(event.detail?.count || 0));
    window.addEventListener('api:activity', onActivity);
    update(getActiveRequestCount());

    return () => {
      window.removeEventListener('api:activity', onActivity);
      clearTimers();
    };
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[10001] h-0.5 overflow-hidden transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="progressbar"
      aria-label="Loading data"
      aria-hidden={!visible}
    >
      <div className="h-full w-1/3 animate-[api-progress_1s_ease-in-out_infinite] rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
      <style jsx>{`
        @keyframes api-progress {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(410%); }
        }
      `}</style>
    </div>
  );
}

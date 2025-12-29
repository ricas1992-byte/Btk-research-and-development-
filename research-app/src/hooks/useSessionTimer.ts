// ============================================
// Hook: Session Timer
// ============================================

import { useEffect, useState } from 'react';
import { CONFIG } from '@shared/config';

export function useSessionTimer() {
  const [sessionStartTime] = useState(new Date());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showLongSessionReminder, setShowLongSessionReminder] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime.getTime();
      setElapsedMs(elapsed);

      // Show reminder at 90 minutes
      if (
        elapsed >= CONFIG.LONG_SESSION_REMINDER_MS &&
        !showLongSessionReminder
      ) {
        setShowLongSessionReminder(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, showLongSessionReminder]);

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return {
    sessionStartTime,
    elapsedMs,
    formattedTime: formatTime(elapsedMs),
    showLongSessionReminder,
    dismissReminder: () => setShowLongSessionReminder(false),
  };
}

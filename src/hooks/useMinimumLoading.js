import { useEffect, useRef, useState } from "react";

export function useMinimumLoading(loading, minimumVisibleMs = 350) {
  const [held, setHeld] = useState(true);
  const startedAt = useRef(0);
  const manuallyStarted = useRef(false);

  const beginLoading = () => {
    startedAt.current = Date.now();
    manuallyStarted.current = true;
    setHeld(true);
  };

  useEffect(() => {
    if (loading) {
      if (!manuallyStarted.current) startedAt.current = Date.now();
      manuallyStarted.current = false;
      return undefined;
    }

    const elapsed = startedAt.current ? Date.now() - startedAt.current : minimumVisibleMs;
    const remaining = Math.max(0, minimumVisibleMs - elapsed);
    const timeoutId = window.setTimeout(() => setHeld(false), remaining);
    return () => window.clearTimeout(timeoutId);
  }, [loading, minimumVisibleMs]);

  return { isVisible: loading || held, beginLoading };
}
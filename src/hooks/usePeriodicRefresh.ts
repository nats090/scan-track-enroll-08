
import { useEffect, useRef } from 'react';

interface UsePeriodicRefreshOptions {
  refreshInterval: number; // in milliseconds
  onRefresh: () => void;
  enabled?: boolean;
}

export const usePeriodicRefresh = ({ 
  refreshInterval, 
  onRefresh, 
  enabled = true 
}: UsePeriodicRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Update the ref when onRefresh changes
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up the interval
    intervalRef.current = setInterval(() => {
      onRefreshRef.current();
    }, refreshInterval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshInterval, enabled]);

  // Manual refresh function
  const refresh = () => {
    onRefreshRef.current();
  };

  return { refresh };
};

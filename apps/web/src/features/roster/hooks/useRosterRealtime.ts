import { useEffect } from 'react';
import { useRosterStore } from '@/store/rosterStore';

/**
 * Hook to refresh roster data periodically.
 * NOTE: Currently disabled — direct sql calls fail in browser.
 * Roster data is fetched via API routes instead.
 */
export const useRosterRealtime = () => {
  const { roster } = useRosterStore();

  useEffect(() => {
    if (!roster?.id) return;
    // TODO: Implement realtime refresh via API endpoint instead of direct sql
  }, [roster?.id]);
};

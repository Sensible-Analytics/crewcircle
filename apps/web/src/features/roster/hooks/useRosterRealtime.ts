import { useEffect } from 'react';
import { useRosterStore } from '@/store/rosterStore';
import { sql } from '@/lib/neon/client';

/**
 * Hook to refresh roster data periodically
 * In demo mode, this just refreshes the data from NeonDB
 */
export const useRosterRealtime = () => {
  const { roster, setShifts, setRoster, fetchCurrentRoster } = useRosterStore();

  useEffect(() => {
    if (!roster?.id) return;

    const rosterId = roster.id;

    const refreshData = async () => {
      const shifts = await sql`SELECT * FROM shifts WHERE roster_id = ${rosterId} AND deleted_at IS NULL`;
      if (shifts.length > 0) {
        setShifts(shifts as any[]);
      }

      const rosters = await sql`SELECT * FROM rosters WHERE id = ${rosterId}`;
      if (rosters.length > 0) {
        setRoster(rosters[0] as any);
      }
    };

    refreshData();
  }, [roster?.id, setShifts, setRoster]);
};

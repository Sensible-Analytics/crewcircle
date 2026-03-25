import { useEffect } from 'react';
import { useRosterStore } from '@/store/rosterStore';
import { createRealtimeSupabaseClient } from '@/packages/supabase/src/client.realtime';

/**
 * Hook to subscribe to realtime updates for roster and shift changes
 * Automatically updates the roster store when changes occur
 */
export const useRosterRealtime = () => {
  const { roster, setShifts, setRoster } = useRosterStore();

  useEffect(() => {
    if (!roster?.id) return;

    const supabase = createRealtimeSupabaseClient();
    const rosterId = roster.id;

    const shiftsChannel = supabase
      .channel(`roster-shifts-${rosterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `roster_id=eq.${rosterId}`,
        },
        async (payload) => {
          const { data: shifts, error } = await supabase
            .from('shifts')
            .select('*')
            .eq('roster_id', rosterId)
            .is('deleted_at', null);

          if (!error && shifts) {
            setShifts(shifts);
          }
        }
      )
      .subscribe();

    const rosterChannel = supabase
      .channel(`roster-${rosterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rosters',
          filter: `id=eq.${rosterId}`,
        },
        async (payload) => {
          const { data: rosterData, error } = await supabase
            .from('rosters')
            .select('*')
            .eq('id', rosterId)
            .single();

          if (!error && rosterData) {
            setRoster(rosterData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(rosterChannel);
    };
  }, [roster?.id, setShifts, setRoster]);
};
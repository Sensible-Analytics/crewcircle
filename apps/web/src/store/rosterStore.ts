import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Profile } from '@/types/profile';
import { Shift } from '@/types/shift';
import { createBrowserSupabaseClient } from '@/packages/supabase/src/client.browser';
import { useAuth } from '@/packages/supabase/src/useAuth';
import { copyShiftsToRoster } from '@/packages/supabase/src/shiftService';

export type RosterStatus = 'draft' | 'published' | 'archived';

export interface Roster {
  id: string;
  tenant_id: string;
  location_id: string;
  week_start: string; // ISO date string
  status: RosterStatus;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  deleted_at: string | null;
}

interface RosterState {
  profiles: Profile[];
  shifts: Shift[];
  roster: Roster | null;
  selectedWeekStart: string;
  loading: boolean;
  operationError: string | null;
  isOperating: boolean;
  setProfiles: (profiles: Profile[]) => void;
    setShifts: (shifts: Shift[]) => void;
    setRoster: (roster: Roster | null) => void;
    setSelectedWeekStart: (date: string) => void;
    setLoading: (loading: boolean) => void;
  setOperationError: (error: string | null) => void;
  setIsOperating: (isOperating: boolean) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (profile: Partial<Profile> & { id: string }) => void;
  removeProfile: (id: string) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shift: Partial<Shift> & { id: string }) => void;
  removeShift: (id: string) => void;
  publishRoster: () => Promise<boolean>;
  unpublishRoster: () => Promise<boolean>;
  copyForwardRoster: () => Promise<boolean>;
  fetchCurrentRoster: (tenantId: string, weekStart: string) => Promise<void>;
}

export const useRosterStore = create<RosterState>()(
  immer((set, get) => ({
    profiles: [],
    shifts: [],
    roster: null,
    selectedWeekStart: new Date().toISOString().split('T')[0],
    loading: true,
    operationError: null,
    isOperating: false,
    setProfiles: (profiles) => set({ profiles }),
    setShifts: (shifts) => set({ shifts }),
    setRoster: (roster) => set({ roster }),
    setSelectedWeekStart: (date) => {
      set({ selectedWeekStart: date });
      const { user, tenantId } = getAuthState();
      if (user && tenantId) {
        get().fetchCurrentRoster(tenantId, date);
      }
    },
    setLoading: (loading) => set({ loading }),
    setOperationError: (error) => set({ operationError: error }),
    setIsOperating: (isOperating) => set({ isOperating }),
    addProfile: (profile) =>
      set((state) => {
        state.profiles.push(profile);
      }),
    updateProfile: (updatedProfile) =>
      set((state) => {
        const index = state.profiles.findIndex((p) => p.id === updatedProfile.id);
        if (index !== -1) {
          state.profiles[index] = { ...state.profiles[index], ...updatedProfile };
        }
      }),
    removeProfile: (id) =>
      set((state) => {
        state.profiles = state.profiles.filter((p) => p.id !== id);
      }),
    addShift: (shift) =>
      set((state) => {
        state.shifts.push(shift);
      }),
    updateShift: (updatedShift) =>
      set((state) => {
        const index = state.shifts.findIndex((s) => s.id === updatedShift.id);
        if (index !== -1) {
          state.shifts[index] = { ...state.shifts[index], ...updatedShift };
        }
      }),
    removeShift: (id) =>
      set((state) => {
        state.shifts = state.shifts.filter((s) => s.id !== id);
      }),
    publishRoster: async () => {
      const { roster } = get();
      if (!roster) {
        set({ operationError: 'No roster selected' });
        return false;
      }

      set({ isOperating: true, operationError: null });
      
     try {
         const supabase = createBrowserSupabaseClient();
         const { error } = await supabase
           .from('rosters')
           .update({ 
             status: 'published',
             published_at: new Date().toISOString(),
             published_by: roster.published_by || 'temp-user-id'
           })
           .eq('id', roster.id);

         if (error) {
           set({ operationError: `Failed to publish roster: ${error.message}` });
           return false;
         }

         set({ roster: { ...roster, status: 'published', published_at: new Date().toISOString() } });

         try {
           await fetch('/functions/v1/on-roster-published', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ roster_id: roster.id }),
           });
         } catch (fetchError) {
           console.warn('Failed to trigger on-roster-published edge function:', fetchError);
         }

         return true;
       } catch (err: any) {
         set({ operationError: `Unexpected error: ${err.message}` });
         return false;
       } finally {
        set({ isOperating: false });
      }
    },
    unpublishRoster: async () => {
      const { roster } = get();
      if (!roster) {
        set({ operationError: 'No roster selected' });
        return false;
      }

      set({ isOperating: true, operationError: null });
      
       try {
         const supabase = createBrowserSupabaseClient();
         const { error } = await supabase
           .from('rosters')
           .update({ 
             status: 'draft',
             published_at: null,
             published_by: null
           })
           .eq('id', roster.id);

         if (error) {
           set({ operationError: `Failed to unpublish roster: ${error.message}` });
           return false;
         }

         set({ roster: { ...roster, status: 'draft', published_at: null, published_by: null } });
         return true;
       } catch (err: any) {
         set({ operationError: `Unexpected error: ${err.message}` });
         return false;
       } finally {
        set({ isOperating: false });
      }
    },
    copyForwardRoster: async () => {
      const { roster } = get();
      if (!roster || roster.status !== 'published') {
        set({ operationError: 'Can only copy forward from a published roster' });
        return false;
      }

      set({ isOperating: true, operationError: null });
      
      try {
        const currentWeekStart = new Date(roster.week_start);
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() + 7);
        
        const supabase = createBrowserSupabaseClient();
        
        const { data: existingRoster, error: fetchError } = await supabase
          .from('rosters')
          .select('id')
          .eq('tenant_id', roster.tenant_id)
          .eq('week_start', newWeekStart.toISOString().split('T')[0])
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          set({ operationError: `Error checking for existing roster: ${fetchError.message}` });
          return false;
        }

        if (existingRoster) {
          const { data: rosterData, error: rosterError } = await supabase
            .from('rosters')
            .select('*')
            .eq('id', existingRoster.id)
            .single();

          if (rosterError) {
            set({ operationError: `Error loading existing roster: ${rosterError.message}` });
            return false;
          }

          if (rosterData) {
            set({ roster: rosterData });
            return true;
          }
        }

         const { data: newRoster, error: insertError } = await supabase
           .from('rosters')
           .insert([
             {
               tenant_id: roster.tenant_id,
               location_id: roster.location_id,
               week_start: newWeekStart.toISOString().split('T')[0],
               status: 'draft',
             }
           ])
           .select()
           .single();

         if (insertError) {
           set({ operationError: `Failed to create new roster: ${insertError.message}` });
           return false;
         }

         set({ roster: newRoster });
         
          try {
            const copiedShifts = await copyShiftsToRoster(
              // @ts-expect-error
              supabase,
              roster.id,
              newRoster.id,
              7
            );
            console.log(`Copied ${copiedShifts.length} shifts to new roster`);
          } catch (copyError: any) {
           set({ operationError: `Failed to copy shifts: ${copyError.message}` });
           return false;
         }

         return true;
       } catch (err: any) {
         set({ operationError: `Unexpected error: ${err.message}` });
         return false;
       } finally {
        set({ isOperating: false });
      }
    },
    fetchCurrentRoster: async (tenantId: string, weekStart: string) => {
      try {
        set({ loading: true });
        const supabase = createBrowserSupabaseClient();
        
        // Get or create a draft roster for the current week and tenant
        let roster: any;
        let rosterError: any;
        
        try {
          const result = await supabase
            .from('rosters')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('week_start', weekStart)
            .eq('status', 'draft')
            .single();
          roster = result.data;
          rosterError = result.error;
        } catch (e) {
          rosterError = e;
        }

        if (rosterError && rosterError.code === 'PGRST116') {
          // No roster found, create one
          const { data: newRoster, error: insertError } = await supabase
            .from('rosters')
            .insert([
              {
                tenant_id: tenantId,
                location_id: '00000000-0000-0000-0000-000000000001', // Default location - should be properly set
                week_start: weekStart,
                status: 'draft',
              }
            ])
            .select();

          if (insertError) throw insertError;
          roster = newRoster?.[0];
        } else if (rosterError) {
          throw rosterError;
        }

        // Get shifts for this roster
        const { data: shifts, error: shiftsError } = await supabase
          .from('shifts')
          .select('*')
          .eq('roster_id', roster.id)
          .is('deleted_at', null);

        if (shiftsError) throw shiftsError;

        set({ 
          roster: roster || null, 
          shifts: shifts || [], 
          loading: false 
        });
      } catch (error) {
        console.error('Failed to fetch roster:', error);
        set({ loading: false });
      }
    }
  }))
);

// Helper function to get auth state without causing circular dependencies
function getAuthState() {
  // This is a temporary solution - in a real app we'd use a proper store or context
  // For now, we'll return empty values and rely on the component to call fetchCurrentRoster
  // when auth data is available
  return {
    user: null,
    tenantId: null
  };
}

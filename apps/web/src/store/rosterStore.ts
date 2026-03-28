import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Profile } from '@/types/profile';
import { Shift } from '@/types/shift';
import { sql } from '@/lib/neon/client';
import { copyShiftsToRoster } from '@/lib/neon/shiftService';

export type RosterStatus = 'draft' | 'published' | 'archived';

export interface Roster {
  id: string;
  tenant_id: string;
  location_id: string;
  week_start: string;
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
    setSelectedWeekStart: (date) => set({ selectedWeekStart: date }),
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
        await sql`
          UPDATE rosters 
          SET status = 'published', 
              published_at = ${new Date().toISOString()},
              published_by = ${roster.published_by || 'temp-user-id'}
          WHERE id = ${roster.id}
        `;

        set({ roster: { ...roster, status: 'published', published_at: new Date().toISOString() } });
        return true;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        set({ operationError: `Failed to publish roster: ${errorMessage}` });
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
        await sql`
          UPDATE rosters 
          SET status = 'draft', 
              published_at = NULL,
              published_by = NULL
          WHERE id = ${roster.id}
        `;

        set({ roster: { ...roster, status: 'draft', published_at: null, published_by: null } });
        return true;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        set({ operationError: `Failed to unpublish roster: ${errorMessage}` });
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
        const newWeekStartStr = newWeekStart.toISOString().split('T')[0];
        
        const existingRosters = await sql`
          SELECT * FROM rosters 
          WHERE tenant_id = ${roster.tenant_id} 
          AND week_start = ${newWeekStartStr}
        `;

        if (existingRosters.length > 0) {
          const existingRoster = existingRosters[0] as Roster;
          set({ roster: existingRoster });
          return true;
        }

        const newRosters = await sql`
          INSERT INTO rosters (tenant_id, location_id, week_start, status)
          VALUES (${roster.tenant_id}, ${roster.location_id}, ${newWeekStartStr}, 'draft')
          RETURNING *
        `;

        if (newRosters.length === 0) {
          set({ operationError: 'Failed to create new roster' });
          return false;
        }

        const newRoster = newRosters[0] as Roster;
        set({ roster: newRoster });
        
        const copiedShifts = await copyShiftsToRoster(roster.id, newRoster.id, 7);
        console.log(`Copied ${copiedShifts.length} shifts to new roster`);

        return true;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        set({ operationError: `Unexpected error: ${errorMessage}` });
        return false;
      } finally {
        set({ isOperating: false });
      }
    },
    fetchCurrentRoster: async (tenantId: string, weekStart: string) => {
      try {
        set({ loading: true });
        
        const rosters = await sql`
          SELECT * FROM rosters 
          WHERE tenant_id = ${tenantId} 
          AND week_start = ${weekStart}
          AND status = 'draft'
        `;

        let roster: Roster | null = null;

        if (rosters.length > 0) {
          roster = rosters[0] as Roster;
        } else {
          const newRosters = await sql`
            INSERT INTO rosters (tenant_id, location_id, week_start, status)
            VALUES (${tenantId}, '00000000-0000-0000-0000-000000000001', ${weekStart}, 'draft')
            RETURNING *
          `;
          
          if (newRosters.length > 0) {
            roster = newRosters[0] as Roster;
          }
        }

        const shifts = roster 
          ? await sql`SELECT * FROM shifts WHERE roster_id = ${roster.id} AND deleted_at IS NULL`
          : [];

        set({ 
          roster, 
          shifts: shifts as Shift[], 
          loading: false 
        });
      } catch (error) {
        console.error('Failed to fetch roster:', error);
        set({ loading: false });
      }
    }
  }))
);

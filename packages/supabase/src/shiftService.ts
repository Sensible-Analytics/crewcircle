import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Shift } from '@/types/shift';
import { shiftSchema } from '@/packages/validators/src/shift';
import { z } from 'zod';

// Type for the Supabase client we'll use
type Supabase = ReturnType<typeof createClient>;

 // Database type for shifts
 interface ShiftDb {
   id: string;
   tenant_id: string;
   roster_id: string | null;
   profile_id: string;
   start_time: string;
   end_time: string;
   role_label: string | null;
   notes: string | null;
   deleted_at: string | null;
   created_at: string;
 }

/**
 * Create a new shift
 * @param supabase Supabase client instance (must be initialized with user session)
 * @param shiftData Data for the new shift (will be validated)
 * @returns Promise<Shift> The created shift
 */
export async function createShift(supabase: Supabase, shiftData: unknown): Promise<Shift> {
   // Validate the input
   const validated = shiftSchema.parse(shiftData);
   
   // Insert the shift
   const { data, error } = await supabase
     .from('shifts')
     // @ts-ignore-next-line
     .insert(validated)
     .select()
     .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('No shift returned after creation');
  }

  return data;
}

/**
 * Get shifts for a roster
 * @param supabase Supabase client instance (must be initialized with user session)
 * @param rosterId The ID of the roster to get shifts for
 * @returns Promise<Shift[]> Array of shifts
 */
export async function getShiftsByRoster(supabase: Supabase, rosterId: string): Promise<Shift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('roster_id', rosterId)
    .is('deleted_at', null); // Exclude soft-deleted shifts

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Update a shift
 * @param supabase Supabase client instance (must be initialized with user session)
 * @param shiftId The ID of the shift to update
 * @param updates Partial shift data to update (will be validated)
 * @returns Promise<Shift> The updated shift
 */
export async function updateShift(supabase: Supabase, shiftId: string, updates: unknown): Promise<Shift> {
  // Validate the input (partial, so we use partial() from zod)
  const validated = shiftSchema.partial().parse(updates);
  
   // Update the shift
   const { data, error } = await supabase
     .from('shifts')
     // @ts-ignore-next-line
     .update(validated)
     .eq('id', shiftId)
     .select()
     .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('No shift returned after update');
  }

  return data;
}

/**
 * Delete a shift (soft delete)
 * @param supabase Supabase client instance (must be initialized with user session)
 * @param shiftId The ID of the shift to delete
 * @returns Promise<void>
 */
export async function deleteShift(supabase: Supabase, shiftId: string): Promise<void> {
   const { error } = await supabase
     .from('shifts')
     // @ts-ignore-next-line
     .update({ deleted_at: new Date().toISOString() })
     .eq('id', shiftId);

  if (error) {
    throw error;
  }
}

/**
 * Get a shift by ID
 * @param supabase Supabase client instance (must be initialized with user session)
 * @param shiftId The ID of the shift to get
 * @returns Promise<Shift | null> The shift or null if not found
 */
export async function getShiftById(supabase: Supabase, shiftId: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('id', shiftId)
    .is('deleted_at', null)
    .single();

  if (error && error.code === 'PGRST116') {
    // No rows returned
    return null;
  }

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Copy shifts from one roster to another
 * @param supabase Supabase client instance (must be initialized with user session)
 * @param sourceRosterId The ID of the roster to copy shifts from
 * @param targetRosterId The ID of the roster to copy shifts to
 * @param dateOffsetDays Number of days to offset the shift dates (default: 7 for next week)
 * @returns Promise<Shift[]> Array of copied shifts
 */
export async function copyShiftsToRoster(
  supabase: Supabase,
  sourceRosterId: string,
  targetRosterId: string,
  dateOffsetDays: number = 7
): Promise<Shift[]> {
  const sourceShifts = await getShiftsByRoster(supabase, sourceRosterId);
  
  if (sourceShifts.length === 0) {
    return [];
  }

  const shiftsToInsert = sourceShifts.map(shift => {
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);
    
    startTime.setDate(startTime.getDate() + dateOffsetDays);
    endTime.setDate(endTime.getDate() + dateOffsetDays);
    
    return {
      tenant_id: shift.tenant_id,
      roster_id: targetRosterId,
      profile_id: shift.profile_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      role_label: shift.role_label,
      notes: shift.notes,
    };
  });

   const { data, error } = await supabase
     .from('shifts')
     // @ts-ignore-next-line
     .insert(shiftsToInsert)
     .select();

  if (error) {
    throw error;
  }

  return data ?? [];
}


import { sql } from '@/lib/neon/client';
import { z } from 'zod';

const shiftSchemaForCreate = z.object({
  tenant_id: z.string().uuid(),
  roster_id: z.string().uuid().optional().nullable(),
  profile_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  role_label: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type Shift = {
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
};

export async function createShift(shiftData: unknown): Promise<Shift> {
  const validated = shiftSchemaForCreate.parse(shiftData);
  
  const result = await sql`
    INSERT INTO shifts (tenant_id, roster_id, profile_id, start_time, end_time, role_label, notes)
    VALUES (
      ${validated.tenant_id},
      ${validated.roster_id},
      ${validated.profile_id},
      ${validated.start_time},
      ${validated.end_time},
      ${validated.role_label},
      ${validated.notes}
    )
    RETURNING *
  `;

  if (result.length === 0) {
    throw new Error('No shift returned after creation');
  }

  return result[0] as Shift;
}

export async function getShiftsByRoster(rosterId: string): Promise<Shift[]> {
  const result = await sql`
    SELECT * FROM shifts 
    WHERE roster_id = ${rosterId} 
    AND deleted_at IS NULL
  `;

  return result as Shift[];
}

export async function updateShift(shiftId: string, updates: unknown): Promise<Shift> {
  const validated = z.object({
    id: z.string().uuid().optional(),
    tenant_id: z.string().uuid().optional(),
    roster_id: z.string().uuid().optional(),
    profile_id: z.string().uuid().optional(),
    start_time: z.string().datetime().optional(),
    end_time: z.string().datetime().optional(),
    role_label: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    deleted_at: z.string().datetime().optional().nullable(),
  }).parse(updates);
  
  const existing = await getShiftById(shiftId);
  if (!existing) throw new Error('Shift not found');

  const startTime = validated.start_time ?? existing.start_time;
  const endTime = validated.end_time ?? existing.end_time;
  const roleLabel = validated.role_label ?? existing.role_label;
  const notes = validated.notes ?? existing.notes;
  const deletedAt = validated.deleted_at ?? existing.deleted_at;

  const result = await sql`
    UPDATE shifts 
    SET 
      start_time = ${startTime},
      end_time = ${endTime},
      role_label = ${roleLabel},
      notes = ${notes},
      deleted_at = ${deletedAt}
    WHERE id = ${shiftId}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new Error('No shift returned after update');
  }

  return result[0] as Shift;
}

export async function deleteShift(shiftId: string): Promise<void> {
  await sql`
    UPDATE shifts 
    SET deleted_at = ${new Date().toISOString()}
    WHERE id = ${shiftId}
  `;
}

export async function getShiftById(shiftId: string): Promise<Shift | null> {
  const result = await sql`
    SELECT * FROM shifts 
    WHERE id = ${shiftId} 
    AND deleted_at IS NULL
  `;

  if (result.length === 0) {
    return null;
  }

  return result[0] as Shift;
}

export async function copyShiftsToRoster(
  sourceRosterId: string,
  targetRosterId: string,
  dateOffsetDays: number = 7
): Promise<Shift[]> {
  const sourceShifts = await getShiftsByRoster(sourceRosterId);
  
  if (sourceShifts.length === 0) {
    return [];
  }

  const insertedShifts: Shift[] = [];
  
  for (const shift of sourceShifts) {
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);
    
    startTime.setDate(startTime.getDate() + dateOffsetDays);
    endTime.setDate(endTime.getDate() + dateOffsetDays);
    
    const result = await sql`
      INSERT INTO shifts (tenant_id, roster_id, profile_id, start_time, end_time, role_label, notes)
      VALUES (
        ${shift.tenant_id},
        ${targetRosterId},
        ${shift.profile_id},
        ${startTime.toISOString()},
        ${endTime.toISOString()},
        ${shift.role_label},
        ${shift.notes}
      )
      RETURNING *
    `;
    
    if (result.length > 0) {
      insertedShifts.push(result[0] as Shift);
    }
  }

  return insertedShifts;
}

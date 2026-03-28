import { z } from 'zod';

// Shift validation schema
export const shiftSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation, required for update
  tenant_id: z.string().uuid(),
  roster_id: z.string().uuid().optional(), // Optional for shifts not yet assigned to a roster
  profile_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  role_label: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  deleted_at: z.string().datetime().nullable(),
}).refine((data) => {
  const start = new Date(data.start_time);
  const end = new Date(data.end_time);
  // start < end
  if (start >= end) {
    return false;
  }
  // duration <= 16 hours
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (durationHours > 16) {
    return false;
  }
  // no zero-length shifts (already covered by start < end, but we can be explicit)
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes <= 0) {
    return false;
  }
  return true;
}, {
  message: 'Shift must have a valid start and end time (start before end, duration between 0 and 16 hours)',
});

// Export the schema and infer the TypeScript type
export type ShiftValues = z.infer<typeof shiftSchema>;

export default shiftSchema;

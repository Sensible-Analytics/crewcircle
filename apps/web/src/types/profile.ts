import { z } from 'zod';

// Profile type based on the database schema
export interface Profile {
  id: string; // uuid
  tenant_id: string; // uuid
  role: 'owner' | 'manager' | 'employee';
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string; // ISO timestamp
  deleted_at: string | null; // ISO timestamp or null
}

// Zod schema for profile validation
export const profileSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  role: z.enum(['owner', 'manager', 'employee']),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  created_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

// Infer the TypeScript type from the schema
export type ProfileValues = z.infer<typeof profileSchema>;

// For backward compatibility
export type ProfileBase = ProfileValues;
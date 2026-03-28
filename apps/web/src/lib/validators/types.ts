// Shift type — used by conflict detection
export interface Shift {
  id?: string;
  tenant_id: string;
  roster_id?: string;
  profile_id: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  role_label?: string;
  notes?: string;
  created_at?: string;
  deleted_at: string | null;
}

// Profile type — basic employee profile
export interface Profile {
  id: string;
  tenant_id: string;
  role: 'owner' | 'manager' | 'employee';
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  deleted_at: string | null;
}

import { ShiftValues } from '@/lib/validators/shift';

// Extend the ShiftValues type with additional properties used in the frontend
export interface Shift extends ShiftValues {
  // Additional frontend-specific properties can be added here
  // For example, computed properties or UI-specific fields
  durationHours?: number;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dateString?: string; // Formatted date for display
  timeString?: string; // Formatted time range for display
}

// For backward compatibility, also export the base type
export type ShiftBase = ShiftValues;
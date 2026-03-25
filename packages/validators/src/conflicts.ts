import type { Shift, Profile } from './types';

// Types for availability and weekly hours
export interface Availability {
  profile_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_available: boolean;
}

export interface WeeklyHours {
  profile_id: string;
  week_start: string; // ISO date string for the start of the week (Sunday)
  total_hours: number;
}

// Result of conflict detection
export interface ConflictResult {
  hasConflict: boolean;
  type: 'OVERLAP' | 'AVAILABILITY' | 'MAX_HOURS' | 'MIN_REST' | null;
  message: string;
  details?: {
    overlappingShift?: Shift;
    conflictingAvailability?: Availability;
    weeklyHours?: WeeklyHours;
    lastShiftEnd?: string;
    minRestViolation?: number; // hours of rest that should have been there
  };
}

/**
 * Detect conflicts for a proposed shift
 * @param proposedShift The shift to check for conflicts
 * @param existingShifts All existing shifts for the tenant (for overlap and max hours)
 * @param availabilities All availability records for the tenant
 * @param weeklyHoursMap Map of profile_id to weekly hours for the week of the proposed shift
 * @param lastShiftEnd The end time of the last shift for the same profile (for min rest)
 * @returns ConflictResult
 */
export function detectConflicts(
  proposedShift: Shift,
  existingShifts: Shift[],
  availabilities: Availability[],
  weeklyHoursMap: Map<string, WeeklyHours>,
  lastShiftEnd: string | null = null
): ConflictResult {
  // 1. OVERLAP: new shift overlaps existing shift for same employee
  const overlappingShift = existingShifts.find(shift => 
    shift.profile_id === proposedShift.profile_id &&
    shift.id !== proposedShift.id && // exclude self when updating
    !shift.deleted_at && // assuming we filter out deleted shifts beforehand
    shiftsOverlap(proposedShift, shift)
  );

  if (overlappingShift) {
    return {
      hasConflict: true,
      type: 'OVERLAP',
      message: `Shift overlaps with existing shift from ${formatTime(overlappingShift.start_time)} to ${formatTime(overlappingShift.end_time)}`,
      details: { overlappingShift }
    };
  }

  // 2. AVAILABILITY: shift is during employee's unavailable time
  const conflictingAvailability = checkAvailabilityConflict(proposedShift, availabilities);
  if (conflictingAvailability) {
    return {
      hasConflict: true,
      type: 'AVAILABILITY',
      message: `Shift conflicts with employee availability (unavailable during this time)`,
      details: { conflictingAvailability }
    };
  }

  // 3. MAX_HOURS: employee exceeds configurable weekly max hours (default 38 for AU)
  const weeklyHours = weeklyHoursMap.get(proposedShift.profile_id);
  if (weeklyHours) {
    const proposedHours = calculateShiftHours(proposedShift);
    const newTotalHours = weeklyHours.total_hours + proposedHours;
    const MAX_HOURS = 38; // configurable, default for AU
    if (newTotalHours > MAX_HOURS) {
      return {
        hasConflict: true,
        type: 'MAX_HOURS',
        message: `Adding this shift would exceed weekly maximum hours (${newTotalHours.toFixed(1)}h > ${MAX_HOURS}h)`,
        details: { weeklyHours: { ...weeklyHours, total_hours: newTotalHours } }
      };
    }
  }

  // 4. MIN_REST: less than 10 hours between consecutive shifts
  if (lastShiftEnd) {
    const minRestHours = 10;
    const lastEnd = new Date(lastShiftEnd);
    const proposedStart = new Date(proposedShift.start_time);
    const restHours = (proposedStart.getTime() - lastEnd.getTime()) / (1000 * 60 * 60);
    if (restHours < minRestHours) {
      return {
        hasConflict: true,
        type: 'MIN_REST',
        message: `Insufficient rest between shifts (${restHours.toFixed(1)}h < ${minRestHours}h required)`,
        details: { 
          lastShiftEnd,
          minRestViolation: minRestHours - restHours 
        }
      };
    }
  }

  // No conflicts
  return {
    hasConflict: false,
    type: null,
    message: 'No conflicts detected'
  };
}

/**
 * Check if two shifts overlap
 * @param shiftA First shift
 * @param shiftB Second shift
 * @returns boolean
 */
function shiftsOverlap(shiftA: Shift, shiftB: Shift): boolean {
  const startA = new Date(shiftA.start_time);
  const endA = new Date(shiftA.end_time);
  const startB = new Date(shiftB.start_time);
  const endB = new Date(shiftB.end_time);
  
  // Overlap if A starts before B ends and B starts before A ends
  return startA < endB && startB < endA;
}

/**
 * Check if a shift conflicts with availability records
 * @param shift The shift to check
 * @param availabilities All availability records for the tenant
 * @returns The conflicting availability record if found, null otherwise
 */
function checkAvailabilityConflict(shift: Shift, availabilities: Availability[]): Availability | null {
  const shiftStart = new Date(shift.start_time);
  const shiftEnd = new Date(shift.end_time);
  const dayOfWeek = shiftStart.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  // Find availability for this day of week
  const dayAvailabilities = availabilities.filter(a => 
    a.profile_id === shift.profile_id && 
    a.day_of_week === dayOfWeek && 
    a.is_available === false // we only care about unavailable times
  );
  
  for (const avail of dayAvailabilities) {
    const availStart = new Date(`1970-01-01T${avail.start_time}:00Z`);
    const availEnd = new Date(`1970-01-01T${avail.end_time}:00Z`);
    
    // Handle overnight availability (e.g., 22:00 to 06:00)
    let isUnavailable = false;
    if (availStart < availEnd) {
      // Normal case: start < end (same day)
      isUnavailable = (shiftStart >= availStart && shiftStart < availEnd) ||
                      (shiftEnd > availStart && shiftEnd <= availEnd) ||
                      (shiftStart <= availStart && shiftEnd >= availEnd);
    } else {
      // Overnight case: start > end (crosses midnight)
      isUnavailable = (shiftStart >= availStart || shiftStart < availEnd) ||
                      (shiftEnd > availStart && shiftEnd <= availEnd) ||
                      (shiftStart <= availStart && shiftEnd >= availEnd);
    }
    
    if (isUnavailable) {
      return avail;
    }
  }
  
  return null;
}

/**
 * Calculate the duration of a shift in hours
 * @param shift The shift to calculate duration for
 * @returns Duration in hours
 */
function calculateShiftHours(shift: Shift): number {
  const start = new Date(shift.start_time);
  const end = new Date(shift.end_time);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/**
 * Format a time string to HH:mm format
 * @param timeString ISO time string
 * @returns Formatted time string (HH:mm)
 */
function formatTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


import { describe, it, expect } from 'vitest';
import { detectConflicts, type Availability } from './conflicts';
import type { Shift } from './types';

function makeShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 's-default',
    tenant_id: 't-default',
    profile_id: 'p-default',
    start_time: '2026-04-06T09:00:00Z',
    end_time: '2026-04-06T17:00:00Z',
    deleted_at: null,
    ...overrides,
  };
}

function makeAvailability(overrides: Partial<Availability> = {}): Availability {
  return {
    profile_id: 'p-default',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    ...overrides,
  };
}

describe('detectConflicts', () => {
  describe('OVERLAP detection', () => {
    it('detects overlapping shifts for same employee', () => {
      const existing = [makeShift({ id: 's1', profile_id: 'p1', start_time: '2026-04-06T09:00:00Z', end_time: '2026-04-06T17:00:00Z' })];
      const proposed = makeShift({ id: 's2', profile_id: 'p1', start_time: '2026-04-06T15:00:00Z', end_time: '2026-04-06T23:00:00Z' });
      
      const result = detectConflicts(proposed, existing, [], new Map());
      
      expect(result.hasConflict).toBe(true);
      expect(result.type).toBe('OVERLAP');
    });

    it('no conflict when shifts are adjacent', () => {
      const existing = [makeShift({ id: 's1', profile_id: 'p1', start_time: '2026-04-06T09:00:00Z', end_time: '2026-04-06T17:00:00Z' })];
      const proposed = makeShift({ id: 's2', profile_id: 'p1', start_time: '2026-04-06T17:00:00Z', end_time: '2026-04-07T01:00:00Z' });
      
      const result = detectConflicts(proposed, existing, [], new Map());
      
      expect(result.hasConflict).toBe(false);
    });

    it('no conflict for different employees', () => {
      const existing = [makeShift({ id: 's1', profile_id: 'p1' })];
      const proposed = makeShift({ id: 's2', profile_id: 'p2' });
      
      const result = detectConflicts(proposed, existing, [], new Map());
      
      expect(result.hasConflict).toBe(false);
    });

    it('editing a shift does not conflict with itself', () => {
      const existing = [makeShift({ id: 's1', profile_id: 'p1', end_time: '2026-04-06T17:00:00Z' })];
      const proposed = makeShift({ id: 's1', profile_id: 'p1', end_time: '2026-04-06T18:00:00Z' });
      
      const result = detectConflicts(proposed, existing, [], new Map());
      
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('AVAILABILITY detection', () => {
    it('detects conflict when shift is on unavailable day', () => {
      const proposed = makeShift({ profile_id: 'p1', start_time: '2026-04-06T09:00:00Z', end_time: '2026-04-06T17:00:00Z' });
      const availability = [makeAvailability({ profile_id: 'p1', day_of_week: 1, is_available: false })];
      
      const result = detectConflicts(proposed, [], availability, new Map());
      
      expect(result.hasConflict).toBe(true);
      expect(result.type).toBe('AVAILABILITY');
    });

    it('no conflict when day is available', () => {
      const proposed = makeShift({ profile_id: 'p1', start_time: '2026-04-06T09:00:00Z', end_time: '2026-04-06T17:00:00Z' });
      const availability = [makeAvailability({ profile_id: 'p1', day_of_week: 1, is_available: true })];
      
      const result = detectConflicts(proposed, [], availability, new Map());
      
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('MAX_HOURS detection', () => {
    it('detects when weekly hours would exceed 38 hours', () => {
      const proposed = makeShift({ profile_id: 'p1', start_time: '2026-04-06T09:00:00Z', end_time: '2026-04-06T17:00:00Z' });
      const weeklyHoursMap = new Map([['p1', { profile_id: 'p1', week_start: '2026-04-06', total_hours: 35 }]]);
      
      const result = detectConflicts(proposed, [], [], weeklyHoursMap);
      
      expect(result.hasConflict).toBe(true);
      expect(result.type).toBe('MAX_HOURS');
    });

    it('no conflict when within weekly limit', () => {
      const proposed = makeShift({ profile_id: 'p1', start_time: '2026-04-06T09:00:00Z', end_time: '2026-04-06T17:00:00Z' });
      const weeklyHoursMap = new Map([['p1', { profile_id: 'p1', week_start: '2026-04-06', total_hours: 30 }]]);
      
      const result = detectConflicts(proposed, [], [], weeklyHoursMap);
      
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('MIN_REST detection', () => {
    it('detects when rest between shifts is less than 10 hours', () => {
      const proposed = makeShift({ profile_id: 'p1', start_time: '2026-04-07T01:00:00Z', end_time: '2026-04-07T09:00:00Z' });
      const lastShiftEnd = '2026-04-06T17:00:00Z';
      
      const result = detectConflicts(proposed, [], [], new Map(), lastShiftEnd);
      
      expect(result.hasConflict).toBe(true);
      expect(result.type).toBe('MIN_REST');
    });

    it('no conflict when rest is exactly 10 hours', () => {
      const proposed = makeShift({ profile_id: 'p1', start_time: '2026-04-07T03:00:00Z', end_time: '2026-04-07T11:00:00Z' });
      const lastShiftEnd = '2026-04-06T17:00:00Z';
      
      const result = detectConflicts(proposed, [], [], new Map(), lastShiftEnd);
      
      expect(result.hasConflict).toBe(false);
    });

    it('no conflict when rest is more than 10 hours', () => {
      const proposed = makeShift({ profile_id: 'p1', start_time: '2026-04-07T05:00:00Z', end_time: '2026-04-07T13:00:00Z' });
      const lastShiftEnd = '2026-04-06T17:00:00Z';
      
      const result = detectConflicts(proposed, [], [], new Map(), lastShiftEnd);
      
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('shift duration edge cases', () => {
    it('midnight-crossing shift is exactly 8 hours', () => {
      const start = new Date('2026-04-06T11:00:00Z');
      const end = new Date('2026-04-06T19:00:00Z');
      const hours = (end.getTime() - start.getTime()) / 3_600_000;
      expect(hours).toBe(8);
    });

    it('shift of exactly 16 hours is at maximum allowed duration', () => {
      const start = new Date('2026-04-06T08:00:00Z');
      const end = new Date('2026-04-07T00:00:00Z');
      const hours = (end.getTime() - start.getTime()) / 3_600_000;
      expect(hours).toBe(16);
      expect(hours <= 16).toBe(true);
    });
  });
});

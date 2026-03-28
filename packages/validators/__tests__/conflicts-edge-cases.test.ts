import { describe, it, expect } from 'vitest';
import { detectConflicts } from '../src/conflicts';
import type { Shift } from '../src/types';

const mockProfileId = '11111111-1111-1111-1111-111111111111';
const mockTenantId = '22222222-2222-2222-2222-222222222222';
const mockRosterId = '33333333-3333-3333-3333-333333333333';

const createMockShift = (overrides: Partial<Shift> = {}): Shift => ({
  id: crypto.randomUUID(),
  tenant_id: mockTenantId,
  roster_id: mockRosterId,
  profile_id: mockProfileId,
  start_time: '2026-04-06T10:00:00Z',
  end_time: '2026-04-06T14:00:00Z',
  role_label: 'Barista',
  notes: '',
  created_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides
});

describe('detectConflicts - overlap detection', () => {
  it('detects partial overlap at start', () => {
    const existingShifts = [
      createMockShift({
        id: 'existing-1',
        start_time: '2026-04-06T11:00:00Z',
        end_time: '2026-04-06T15:00:00Z'
      })
    ];
    const proposedShift = createMockShift({
      start_time: '2026-04-06T09:00:00Z',
      end_time: '2026-04-06T12:00:00Z'
    });

    const result = detectConflicts(proposedShift, existingShifts, [], new Map());

    expect(result.hasConflict).toBe(true);
    expect(result.type).toBe('OVERLAP');
  });

  it('detects partial overlap at end', () => {
    const existingShifts = [
      createMockShift({
        id: 'existing-1',
        start_time: '2026-04-06T11:00:00Z',
        end_time: '2026-04-06T15:00:00Z'
      })
    ];
    const proposedShift = createMockShift({
      start_time: '2026-04-06T13:00:00Z',
      end_time: '2026-04-06T17:00:00Z'
    });

    const result = detectConflicts(proposedShift, existingShifts, [], new Map());

    expect(result.hasConflict).toBe(true);
    expect(result.type).toBe('OVERLAP');
  });

  it('detects complete containment', () => {
    const existingShifts = [
      createMockShift({
        id: 'existing-1',
        start_time: '2026-04-06T09:00:00Z',
        end_time: '2026-04-06T17:00:00Z'
      })
    ];
    const proposedShift = createMockShift({
      start_time: '2026-04-06T11:00:00Z',
      end_time: '2026-04-06T15:00:00Z'
    });

    const result = detectConflicts(proposedShift, existingShifts, [], new Map());

    expect(result.hasConflict).toBe(true);
    expect(result.type).toBe('OVERLAP');
  });

  it('detects complete containment of existing', () => {
    const existingShifts = [
      createMockShift({
        id: 'existing-1',
        start_time: '2026-04-06T11:00:00Z',
        end_time: '2026-04-06T15:00:00Z'
      })
    ];
    const proposedShift = createMockShift({
      start_time: '2026-04-06T09:00:00Z',
      end_time: '2026-04-06T17:00:00Z'
    });

    const result = detectConflicts(proposedShift, existingShifts, [], new Map());

    expect(result.hasConflict).toBe(true);
    expect(result.type).toBe('OVERLAP');
  });

  it('allows adjacent shifts (no overlap)', () => {
    const existingShifts = [
      createMockShift({
        id: 'existing-1',
        start_time: '2026-04-06T10:00:00Z',
        end_time: '2026-04-06T14:00:00Z'
      })
    ];
    const proposedShift = createMockShift({
      start_time: '2026-04-06T14:00:00Z',
      end_time: '2026-04-06T18:00:00Z'
    });

    const result = detectConflicts(proposedShift, existingShifts, [], new Map());

    expect(result.hasConflict).toBe(false);
  });

  it('does not conflict with different employee', () => {
    const existingShifts = [
      createMockShift({
        id: 'existing-1',
        profile_id: 'other-profile-id',
        start_time: '2026-04-06T10:00:00Z',
        end_time: '2026-04-06T14:00:00Z'
      })
    ];
    const proposedShift = createMockShift({
      start_time: '2026-04-06T10:00:00Z',
      end_time: '2026-04-06T14:00:00Z'
    });

    const result = detectConflicts(proposedShift, existingShifts, [], new Map());

    expect(result.hasConflict).toBe(false);
  });
});

describe('detectConflicts - availability conflict', () => {
  it('detects conflict when employee is unavailable', () => {
    const availabilities = [{
      profile_id: mockProfileId,
      day_of_week: 0, // Sunday
      start_time: '06:00',
      end_time: '22:00',
      is_available: false
    }];

    const proposedShift = createMockShift({
      start_time: '2026-04-05T10:00:00Z', // Sunday
      end_time: '2026-04-05T14:00:00Z'
    });

    const result = detectConflicts(proposedShift, [], availabilities, new Map());

    expect(result.hasConflict).toBe(true);
    expect(result.type).toBe('AVAILABILITY');
  });

  it('allows shift when employee is available', () => {
    const availabilities = [{
      profile_id: mockProfileId,
      day_of_week: 0,
      start_time: '06:00',
      end_time: '22:00',
      is_available: true
    }];

    const proposedShift = createMockShift({
      start_time: '2026-04-05T10:00:00Z',
      end_time: '2026-04-05T14:00:00Z'
    });

    const result = detectConflicts(proposedShift, [], availabilities, new Map());

    expect(result.hasConflict).toBe(false);
  });
});

describe('detectConflicts - max hours', () => {
  it('detects when adding shift exceeds 38 hours', () => {
    const weeklyHoursMap = new Map();
    weeklyHoursMap.set(mockProfileId, {
      profile_id: mockProfileId,
      week_start: '2026-04-05',
      total_hours: 36
    });

    const proposedShift = createMockShift({
      start_time: '2026-04-06T10:00:00Z',
      end_time: '2026-04-06T14:00:00Z' // 4 hours
    });

    const result = detectConflicts(proposedShift, [], [], weeklyHoursMap);

    expect(result.hasConflict).toBe(true);
    expect(result.type).toBe('MAX_HOURS');
  });

  it('allows shift when under 38 hours', () => {
    const weeklyHoursMap = new Map();
    weeklyHoursMap.set(mockProfileId, {
      profile_id: mockProfileId,
      week_start: '2026-04-05',
      total_hours: 30
    });

    const proposedShift = createMockShift({
      start_time: '2026-04-06T10:00:00Z',
      end_time: '2026-04-06T14:00:00Z' // 4 hours -> total 34
    });

    const result = detectConflicts(proposedShift, [], [], weeklyHoursMap);

    expect(result.hasConflict).toBe(false);
  });
});

describe('detectConflicts - minimum rest period', () => {
  it('detects when less than 10 hours rest', () => {
    const lastShiftEnd = '2026-04-06T08:00:00Z';

    const proposedShift = createMockShift({
      start_time: '2026-04-06T15:00:00Z', // Only 7 hours rest
      end_time: '2026-04-06T19:00:00Z'
    });

    const result = detectConflicts(proposedShift, [], [], new Map(), lastShiftEnd);

    expect(result.hasConflict).toBe(true);
    expect(result.type).toBe('MIN_REST');
  });

  it('allows when exactly 10 hours rest', () => {
    const lastShiftEnd = '2026-04-06T08:00:00Z';

    const proposedShift = createMockShift({
      start_time: '2026-04-06T18:00:00Z', // Exactly 10 hours rest
      end_time: '2026-04-06T22:00:00Z'
    });

    const result = detectConflicts(proposedShift, [], [], new Map(), lastShiftEnd);

    expect(result.hasConflict).toBe(false);
  });

  it('allows when more than 10 hours rest', () => {
    const lastShiftEnd = '2026-04-06T08:00:00Z';

    const proposedShift = createMockShift({
      start_time: '2026-04-06T20:00:00Z', // 12 hours rest
      end_time: '2026-04-07T00:00:00Z'
    });

    const result = detectConflicts(proposedShift, [], [], new Map(), lastShiftEnd);

    expect(result.hasConflict).toBe(false);
  });
});

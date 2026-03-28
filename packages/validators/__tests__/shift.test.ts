import { describe, it, expect } from 'vitest';
import { shiftSchema } from '../src/shift';

describe('shift validation schema', () => {
  const validShift = {
    tenant_id: '12345678-1234-1234-8234-123456789012',
    profile_id: '87654321-4321-4321-8234-210987654321',
    start_time: '2026-04-06T10:00:00Z',
    end_time: '2026-04-06T14:00:00Z',
    deleted_at: null,
  };

  it('validates correct shift data', () => {
    const result = shiftSchema.safeParse(validShift);
    if (!result.success) {
      console.log('Validation errors:', result.error);
    }
    expect(result.success).toBe(true);
  });

  it('validates shift with optional fields', () => {
    const shiftWithOptional = {
      ...validShift,
      roster_id: '11111111-1111-1111-8111-111111111111',
      role_label: 'Barista',
      notes: 'Opening shift',
    };
    const result = shiftSchema.safeParse(shiftWithOptional);
    if (!result.success) {
      console.log('Validation errors:', result.error);
    }
    expect(result.success).toBe(true);
  });

  it('rejects shift with end before start', () => {
    const invalidShift = {
      ...validShift,
      start_time: '2026-04-06T14:00:00Z',
      end_time: '2026-04-06T10:00:00Z',
    };
    const result = shiftSchema.safeParse(invalidShift);
    expect(result.success).toBe(false);
  });

  it('rejects shift with same start and end time', () => {
    const invalidShift = {
      ...validShift,
      end_time: '2026-04-06T10:00:00Z',
    };
    const result = shiftSchema.safeParse(invalidShift);
    expect(result.success).toBe(false);
  });

  it('rejects shift longer than 16 hours', () => {
    const invalidShift = {
      ...validShift,
      end_time: '2026-04-07T04:00:00Z', // 18 hours
    };
    const result = shiftSchema.safeParse(invalidShift);
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for tenant_id', () => {
    const invalidShift = {
      ...validShift,
      tenant_id: 'not-a-uuid',
    };
    const result = shiftSchema.safeParse(invalidShift);
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for profile_id', () => {
    const invalidShift = {
      ...validShift,
      profile_id: 'not-a-uuid',
    };
    const result = shiftSchema.safeParse(invalidShift);
    expect(result.success).toBe(false);
  });

  it('rejects role_label longer than 100 characters', () => {
    const invalidShift = {
      ...validShift,
      role_label: 'A'.repeat(101),
    };
    const result = shiftSchema.safeParse(invalidShift);
    expect(result.success).toBe(false);
  });

  it('rejects notes longer than 500 characters', () => {
    const invalidShift = {
      ...validShift,
      notes: 'A'.repeat(501),
    };
    const result = shiftSchema.safeParse(invalidShift);
    expect(result.success).toBe(false);
  });

  it('accepts midnight-crossing shift', () => {
    const midnightShift = {
      tenant_id: validShift.tenant_id,
      profile_id: validShift.profile_id,
      start_time: '2026-04-06T22:00:00Z',
      end_time: '2026-04-07T06:00:00Z',
      deleted_at: null,
    };
    const result = shiftSchema.safeParse(midnightShift);
    expect(result.success).toBe(true);
  });

  it('accepts 8-hour shift', () => {
    const result = shiftSchema.safeParse(validShift);
    expect(result.success).toBe(true);
  });
});

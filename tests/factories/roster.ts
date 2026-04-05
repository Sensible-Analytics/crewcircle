import { testSql, generateTestId } from '../helpers/db';
import { startOfWeek, addDays, format } from 'date-fns';

export interface TestShift {
  shiftId: string;
  profileId: string;
  startTime: string;
  endTime: string;
}

export async function createTestRoster(
  tenantId: string,
  locationId: string,
  weekOffset = 0,
  status: 'draft' | 'published' = 'draft'
): Promise<{ rosterId: string; weekStart: string }> {
  const rosterId = generateTestId();
  const weekStart = format(
    startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 }),
    'yyyy-MM-dd'
  );

  if (status === 'published') {
    await testSql`
      INSERT INTO rosters (id, tenant_id, location_id, week_start, status, published_at)
      VALUES (${rosterId}, ${tenantId}, ${locationId}, ${weekStart}, ${status}, NOW())
    `;
  } else {
    await testSql`
      INSERT INTO rosters (id, tenant_id, location_id, week_start, status)
      VALUES (${rosterId}, ${tenantId}, ${locationId}, ${weekStart}, ${status})
    `;
  }

  return { rosterId, weekStart };
}

export async function createTestShift(
  tenantId: string,
  locationId: string,
  rosterId: string,
  profileId: string,
  options: {
    dayOffset?: number;
    startHour?: number;
    durationHours?: number;
    roleLabel?: string;
  } = {}
): Promise<TestShift> {
  const shiftId = generateTestId();
  const dayOffset = options.dayOffset ?? 0;
  const startHour = options.startHour ?? 9;
  const durationHours = options.durationHours ?? 8;
  const roleLabel = options.roleLabel || 'Staff';

  const { data: rosterResult } = await testSql`
    SELECT week_start FROM rosters WHERE id = ${rosterId}
  ` as any;
  
  const roster = rosterResult?.[0] || { week_start: format(new Date(), 'yyyy-MM-dd') };
  const monday = new Date(roster.week_start + 'T00:00:00Z');
  const shiftDay = addDays(monday, dayOffset);

  const startTime = new Date(shiftDay);
  startTime.setUTCHours(startHour, 0, 0, 0);

  const endTime = new Date(startTime.getTime() + durationHours * 3600 * 1000);

  await testSql`
    INSERT INTO shifts (id, tenant_id, location_id, roster_id, profile_id, start_time, end_time, role_label)
    VALUES (
      ${shiftId}, ${tenantId}, ${locationId}, ${rosterId}, ${profileId},
      ${startTime.toISOString()}, ${endTime.toISOString()}, ${roleLabel}
    )
  `;

  return {
    shiftId,
    profileId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  };
}

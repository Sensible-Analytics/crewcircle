-- Seed Demo Organization Data
-- This creates "The Daily Grind Cafe" demo tenant with sample data

-- Demo tenant
INSERT INTO tenants (id, name, abn, timezone, plan) VALUES
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'The Daily Grind Cafe', '51824753556', 'Australia/Sydney', 'free')
ON CONFLICT (id) DO NOTHING;

-- Demo location
INSERT INTO locations (id, tenant_id, name, address, latitude, longitude, geofence_radius_m, timezone) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'Main Cafe - Surry Hills', '42 Crown Street, Surry Hills NSW 2010', -33.8833, 151.2167, 150, 'Australia/Sydney')
ON CONFLICT (id) DO NOTHING;

-- Current week's Monday
DO $$
DECLARE
  today_date DATE := CURRENT_DATE;
  monday_date DATE := today_date - EXTRACT(DOW FROM today_date)::int + 1;
  roster_id uuid;
BEGIN
  -- Create published roster for current week
  INSERT INTO rosters (id, tenant_id, location_id, week_start, status) VALUES
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', monday_date, 'published')
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO roster_id FROM rosters WHERE tenant_id = '4fdcd51f-04bc-4f72-8909-3bc0f75934f1' AND week_start = monday_date;

  -- Shifts for the week (Sarah - Barista Mon-Fri 6am-2pm)
  INSERT INTO shifts (tenant_id, location_id, roster_id, profile_id, start_time, end_time, role_label) VALUES
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee1-uuid', monday_date + INTERVAL '0 days' + INTERVAL '6 hours', monday_date + INTERVAL '0 days' + INTERVAL '14 hours', 'Barista'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee1-uuid', monday_date + INTERVAL '1 days' + INTERVAL '6 hours', monday_date + INTERVAL '1 days' + INTERVAL '14 hours', 'Barista'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee1-uuid', monday_date + INTERVAL '2 days' + INTERVAL '6 hours', monday_date + INTERVAL '2 days' + INTERVAL '14 hours', 'Barista'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee1-uuid', monday_date + INTERVAL '3 days' + INTERVAL '6 hours', monday_date + INTERVAL '3 days' + INTERVAL '14 hours', 'Barista'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee1-uuid', monday_date + INTERVAL '4 days' + INTERVAL '6 hours', monday_date + INTERVAL '4 days' + INTERVAL '14 hours', 'Barista')
  ON CONFLICT DO NOTHING;

  -- Shifts for Jake (Manager Mon-Fri 8am-4pm)
  INSERT INTO shifts (tenant_id, location_id, roster_id, profile_id, start_time, end_time, role_label) VALUES
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-manager-uuid', monday_date + INTERVAL '0 days' + INTERVAL '8 hours', monday_date + INTERVAL '0 days' + INTERVAL '16 hours', 'Manager'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-manager-uuid', monday_date + INTERVAL '1 days' + INTERVAL '8 hours', monday_date + INTERVAL '1 days' + INTERVAL '16 hours', 'Manager'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-manager-uuid', monday_date + INTERVAL '2 days' + INTERVAL '8 hours', monday_date + INTERVAL '2 days' + INTERVAL '16 hours', 'Manager'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-manager-uuid', monday_date + INTERVAL '3 days' + INTERVAL '8 hours', monday_date + INTERVAL '3 days' + INTERVAL '16 hours', 'Manager'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-manager-uuid', monday_date + INTERVAL '4 days' + INTERVAL '8 hours', monday_date + INTERVAL '4 days' + INTERVAL '16 hours', 'Manager')
  ON CONFLICT DO NOTHING;

  -- Shifts for Emma (Server Tue-Sat 12pm-8pm)
  INSERT INTO shifts (tenant_id, location_id, roster_id, profile_id, start_time, end_time, role_label) VALUES
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee2-uuid', monday_date + INTERVAL '1 days' + INTERVAL '12 hours', monday_date + INTERVAL '1 days' + INTERVAL '20 hours', 'Server'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee2-uuid', monday_date + INTERVAL '2 days' + INTERVAL '12 hours', monday_date + INTERVAL '2 days' + INTERVAL '20 hours', 'Server'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee2-uuid', monday_date + INTERVAL '3 days' + INTERVAL '12 hours', monday_date + INTERVAL '3 days' + INTERVAL '20 hours', 'Server'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee2-uuid', monday_date + INTERVAL '4 days' + INTERVAL '12 hours', monday_date + INTERVAL '4 days' + INTERVAL '20 hours', 'Server'),
    ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', roster_id, 'demo-employee2-uuid', monday_date + INTERVAL '5 days' + INTERVAL '12 hours', monday_date + INTERVAL '5 days' + INTERVAL '20 hours', 'Server')
  ON CONFLICT DO NOTHING;

END $$;

-- Availability for all demo users (all days 6am-10pm)
INSERT INTO availability (tenant_id, profile_id, day_of_week, start_time, end_time, is_available) VALUES
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-owner-uuid', 1, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-owner-uuid', 2, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-owner-uuid', 3, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-owner-uuid', 4, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-owner-uuid', 5, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-owner-uuid', 6, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-owner-uuid', 0, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-manager-uuid', 1, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-manager-uuid', 2, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-manager-uuid', 3, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-manager-uuid', 4, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-manager-uuid', 5, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-manager-uuid', 6, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-manager-uuid', 0, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee1-uuid', 1, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee1-uuid', 2, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee1-uuid', 3, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee1-uuid', 4, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee1-uuid', 5, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee1-uuid', 6, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee1-uuid', 0, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee2-uuid', 1, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee2-uuid', 2, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee2-uuid', 3, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee2-uuid', 4, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee2-uuid', 5, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee2-uuid', 6, '06:00:00', '22:00:00', true),
  ('4fdcd51f-04bc-4f72-8909-3bc0f75934f1', 'demo-employee2-uuid', 0, '06:00:00', '22:00:00', true)
ON CONFLICT DO NOTHING;

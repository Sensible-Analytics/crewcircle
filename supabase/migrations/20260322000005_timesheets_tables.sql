-- Create timesheet_entries table to store paired clock_in and clock_out events
create table timesheet_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  shift_id uuid references shifts(id) on delete set null,
  clock_in_id uuid references clock_events(id) on delete set null,
  clock_out_id uuid references clock_events(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz,
  total_hours numeric(10, 2),
  is_within_geofence boolean default true,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Add indexes for performance
create index idx_timesheet_entries_tenant_id on timesheet_entries(tenant_id);
create index idx_timesheet_entries_profile_id on timesheet_entries(profile_id);
create index idx_timesheet_entries_start_time on timesheet_entries(start_time);
create index idx_timesheet_entries_deleted_at on timesheet_entries(deleted_at);

-- Enable Row Level Security
alter table timesheet_entries enable row level security;

-- Create policy: users can only see their own tenant's timesheet entries
create policy "Users can only see timesheet entries from their tenant" on timesheet_entries
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and tenant_id = timesheet_entries.tenant_id
    )
  );

-- Create policy: users can only update timesheet entries for their tenant (managers/owners only)
create policy "Managers can update timesheet entries for their tenant" on timesheet_entries
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and tenant_id = timesheet_entries.tenant_id
      and role in ('owner', 'manager')
    )
  );

-- Set REPLICA IDENTITY FULL for realtime
alter table timesheet_entries replica identity full;

-- Create function to automatically pair clock events into timesheet entries
create or replace function process_clock_event()
returns trigger as $$
declare
  v_open_entry_id uuid;
begin
  if (NEW.type = 'clock_in') then
    -- Create a new open entry
    insert into timesheet_entries (
      tenant_id,
      profile_id,
      location_id,
      shift_id,
      clock_in_id,
      start_time,
      is_within_geofence
    ) values (
      NEW.tenant_id,
      NEW.profile_id,
      NEW.location_id,
      NEW.shift_id,
      NEW.id,
      NEW.recorded_at,
      coalesce(NEW.is_within_geofence, true)
    );
  elsif (NEW.type = 'clock_out') then
    -- Find the most recent open entry for this profile
    select id into v_open_entry_id
    from timesheet_entries
    where profile_id = NEW.profile_id
      and clock_out_id is null
      and deleted_at is null
    order by start_time desc
    limit 1;

    if (v_open_entry_id is not null) then
      update timesheet_entries
      set 
        clock_out_id = NEW.id,
        end_time = NEW.recorded_at,
        total_hours = extract(epoch from (NEW.recorded_at - start_time)) / 3600,
        is_within_geofence = is_within_geofence and coalesce(NEW.is_within_geofence, true),
        updated_at = now()
      where id = v_open_entry_id;
    else
      -- If no open entry, create one with only clock_out?
      -- Actually, we should probably just ignore it or create an entry with null start_time (but start_time is not null)
      -- Let's just create an entry with start_time = end_time for now if we want to track it
      insert into timesheet_entries (
        tenant_id,
        profile_id,
        location_id,
        shift_id,
        clock_out_id,
        start_time,
        end_time,
        total_hours,
        is_within_geofence
      ) values (
        NEW.tenant_id,
        NEW.profile_id,
        NEW.location_id,
        NEW.shift_id,
        NEW.id,
        NEW.recorded_at,
        NEW.recorded_at,
        0,
        coalesce(NEW.is_within_geofence, true)
      );
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger on clock_events table
create trigger trigger_process_clock_event
after insert on clock_events
for each row
execute function process_clock_event();

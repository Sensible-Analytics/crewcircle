-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create tenants table
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  abn text unique not null,
  timezone text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create locations table
create table locations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  geofence_radius_m integer not null default 150,
  timezone text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create profiles table (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'employee')),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create tenant_members table (many-to-metween tenants and profiles, but we already have tenant_id in profiles)
-- Actually, we can use profiles for membership, but we'll keep tenant_members for invitation tracking.
create table tenant_members (
  tenant_id uuid not null references tenants(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'employee')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz null,
  deleted_at timestamptz null,
  primary key (tenant_id, profile_id)
);

-- Create rosters table
create table rosters (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  week_start date not null,
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  published_at timestamptz null,
  published_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create shifts table
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  roster_id uuid references rosters(id) on delete set null,
  profile_id uuid not null references profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  role_label text,
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create availability table
create table availability (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create clock_events table
create table clock_events (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  profile_id uuid not null references profiles(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  type text not null check (type in ('clock_in', 'clock_out')),
  recorded_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  accuracy_m integer,
  is_within_geofence boolean,
  source text not null check (source in ('mobile', 'kiosk', 'manual')),
  idempotency_key uuid not null default uuid_generate_v4(),
  deleted_at timestamptz null
);

-- Create messages table
create table messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  channel_id uuid references channels(id) on delete set null,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create channels table
create table channels (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null check (type in ('team', 'direct')),
  name text,
  member_ids uuid[] not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Create indexes for performance
create index idx_tenants_deleted_at on tenants(deleted_at);
create index idx_locations_tenant_id on locations(tenant_id);
create index idx_locations_deleted_at on locations(deleted_at);
create index idx_profiles_tenant_id on profiles(tenant_id);
create index idx_profiles_deleted_at on profiles(deleted_at);
create index idx_tenant_members_tenant_id on tenant_members(tenant_id);
create index idx_tenant_members_profile_id on tenant_members(profile_id);
create index idx_tenant_members_deleted_at on tenant_members(deleted_at);
create index idx_rosters_tenant_id on rosters(tenant_id);
create index idx_rosters_location_id on rosters(location_id);
create index idx_rosters_week_start on rosters(week_start);
create index idx_rosters_status on rosters(status);
create index idx_rosters_deleted_at on rosters(deleted_at);
create index idx_shifts_tenant_id on shifts(tenant_id);
create index idx_shifts_location_id on shifts(location_id);
create index idx_shifts_roster_id on shifts(roster_id);
create index idx_shifts_profile_id on shifts(profile_id);
create index idx_shifts_start_end on shifts(start_time, end_time);
create index idx_shifts_deleted_at on shifts(deleted_at);
create index idx_availability_tenant_id on availability(tenant_id);
create index idx_availability_profile_id on availability(profile_id);
create index idx_availability_day_of_week on availability(day_of_week);
create index idx_availability_deleted_at on availability(deleted_at);
create index idx_clock_events_tenant_id on clock_events(tenant_id);
create index idx_clock_events_location_id on clock_events(location_id);
create index idx_clock_events_profile_id on clock_events(profile_id);
create index idx_clock_events_shift_id on clock_events(shift_id);
create index idx_clock_events_recorded_at on clock_events(recorded_at);
create index idx_clock_events_deleted_at on clock_events(deleted_at);
create index idx_messages_tenant_id on messages(tenant_id);
create index idx_messages_channel_id on messages(channel_id);
create index idx_messages_sender_id on messages(sender_id);
create index idx_messages_created_at on messages(created_at);
create index idx_messages_deleted_at on messages(deleted_at);
create index idx_channels_tenant_id on channels(tenant_id);
create index idx_channels_type on channels(type);
create index idx_channels_deleted_at on channels(deleted_at);

-- Enable Row Level Security on all tables
alter table tenants enable row level security;
alter table locations enable row level security;
alter table profiles enable row level security;
alter table tenant_members enable row level security;
alter table rosters enable row level security;
alter table shifts enable row level security;
alter table availability enable row level security;
alter table clock_events enable row level security;
alter table messages enable row level security;
alter table channels enable row level security;

-- Create function to get current tenant_id from auth.uid()
create or replace function is_tenant_member(p_tenant_id uuid)
returns boolean as $$
  declare
    v_tenant_id uuid;
  begin
    select tenant_id into v_tenant_id
    from profiles
    where id = auth.uid()
    limit 1;

    if v_tenant_id is null then
      return false;
    end if;

    return v_tenant_id = p_tenant_id;
  end;
$$ language plpgsql security definer;

-- Create RLS policies for each table

-- Tenants: users can only see their own tenant
create policy "Tenants are viewable by tenant members" on tenants
  for select using (is_tenant_member(id));

-- Locations: users can only see locations in their tenant
create policy "Locations are viewable by tenant members" on locations
  for select using (is_tenant_member(tenant_id));

-- Profiles: users can only see profiles in their tenant
create policy "Profiles are viewable by tenant members" on profiles
  for select using (is_tenant_member(tenant_id));

-- Tenant members: users can only see tenant members in their tenant
create policy "Tenant members are viewable by tenant members" on tenant_members
  for select using (is_tenant_member(tenant_id));

-- Rosters: users can only see rosters in their tenant
create policy "Rosters are viewable by tenant members" on rosters
  for select using (is_tenant_member(tenant_id));

-- Shifts: users can only see shifts in their tenant
create policy "Shifts are viewable by tenant members" on shifts
  for select using (is_tenant_member(tenant_id));

-- Availability: users can only see availability in their tenant
create policy "Availability is viewable by tenant members" on availability
  for select using (is_tenant_member(tenant_id));

-- Clock events: users can only see clock events in their tenant
create policy "Clock events are viewable by tenant members" on clock_events
  for select using (is_tenant_member(tenant_id));

-- Messages: users can only see messages in their tenant
create policy "Messages are viewable by tenant members" on messages
  for select using (is_tenant_member(tenant_id));

-- Channels: users can only see channels in their tenant
create policy "Channels are viewable by tenant members" on channels
  for select using (is_tenant_member(tenant_id));

-- Set REPLICA IDENTITY FULL for tables we want to use with Supabase Realtime
alter table rosters replica identity full;
alter table shifts replica identity full;
alter table clock_events replica identity full;
alter table messages replica identity full;

-- Add ABN validation constraint (Modulus 89) to tenants table
-- We'll do this via a check constraint that uses a function to validate the ABN.
-- First, create a function to validate ABN using Modulus 89.
create or replace function validate_abn(abn text)
returns boolean as $$
  declare
    v_abn text := regexp_replace(abn, '\s', '', 'g'); -- remove spaces
    v_weight int[] := array[10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    v_sum int := 0;
    v_digit int;
    v_check_digit int;
    i int;
  begin
    if length(v_abn) <> 11 then
      return false;
    end if;

    -- Check that all characters are digits
    if v_abn !~ '^\d{11}$' then
      return false;
    end if;

    -- Calculate the weighted sum of the first 9 digits
    for i in 1..9 loop
      v_digit := (v_abn[i])::int;
      v_sum := v_sum + (v_digit * v_weight[i]);
    end loop;

    -- Calculate the check digit: (v_sum mod 89)
    v_check_digit := v_sum % 89;

    -- The last two digits of the ABN should equal the check digit
    if (v_abn[10]::int * 10 + v_abn[11]::int) = v_check_digit then
      return true;
    else
      return false;
    end if;
  end;
$$ language plpgsql;

-- Add check constraint to tenants table
alter table tenants
add constraint valid_abn check (validate_abn(abn));

-- Note: We are not inserting any data in this migration.

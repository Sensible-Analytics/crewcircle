-- Create shift_reminders table to track when reminders were sent for shifts
-- This prevents sending duplicate reminders for the same shift within a short time window

create table shift_reminders (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid not null references shifts(id) on delete cascade,
  sent_at timestamptz not null default now(),
  -- We'll consider a reminder "recent" if sent in the last 30 minutes
  -- This allows us to avoid sending reminders too frequently
);

-- Add indexes for performance
create index idx_shift_reminders_shift_id on shift_reminders(shift_id);
create index idx_shift_reminders_sent_at on shift_reminders(sent_at);

-- Enable Row Level Security
alter table shift_reminders enable row level security;

-- Create policy: users can only see their own tenant's shift reminders
create policy "Users can only see shift reminders from their tenant" on shift_reminders
  for select using (
    exists (
      select 1 from shifts
      join profiles on shifts.profile_id = profiles.id
      where shifts.id = shift_reminders.shift_id
      and profiles.tenant_id = (
        select tenant_id from profiles where id = auth.uid() limit 1
      )
    )
  );

-- Create policy: users can only insert shift reminders for their tenant
create policy "Users can only insert shift reminders for their tenant" on shift_reminders
  for insert with check (
    exists (
      select 1 from shifts
      join profiles on shifts.profile_id = profiles.id
      where shifts.id = NEW.shift_id
      and profiles.tenant_id = (
        select tenant_id from profiles where id = auth.uid() limit 1
      )
    )
  );

-- Set REPLICA IDENTITY FULL for realtime subscriptions (if needed)
alter table shift_reminders replica identity full;
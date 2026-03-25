-- Create push_tokens table for storing device push notification tokens
create table push_tokens (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for performance
create index idx_push_tokens_profile_id on push_tokens(profile_id);
create index idx_push_tokens_expo_push_token on push_tokens(expo_push_token);

-- Enable Row Level Security
alter table push_tokens enable row level security;

-- Create policy: users can only see their own push tokens
create policy "Users can only see their own push tokens" on push_tokens
  for select using (auth.uid() = profile_id);

-- Create policy: users can only insert their own push tokens
create policy "Users can only insert their own push tokens" on push_tokens
  for insert with check (auth.uid() = profile_id);

-- Create policy: users can only update their own push tokens
create policy "Users can only update their own push tokens" on push_tokens
  for update using (auth.uid() = profile_id);

-- Create policy: users can only delete their own push tokens
create policy "Users can only delete their own push tokens" on push_tokens
  for delete using (auth.uid() = profile_id);

-- Set REPLICA IDENTITY FULL for realtime subscriptions
alter table push_tokens replica identity full;
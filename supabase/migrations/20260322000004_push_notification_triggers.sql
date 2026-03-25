-- Enable the pg_net extension to allow HTTP requests from PostgreSQL
create extension if not exists "pg_net";

-- Create function to call on-roster-published edge function
create or replace function call_on_roster_published()
returns trigger as $$
declare
  service_role_key text;
  supabase_url text;
begin
  -- Get the Supabase URL and service role key from the environment or use placeholders
  -- Note: In local development, you might need to set these manually or use the internal service URL
  supabase_url := 'http://kong:8000'; -- Internal URL for Kong in Supabase Docker
  -- We don't have the service role key here easily, so we might need a different approach 
  -- or ensure it's passed somehow. 
  -- Actually, we can use the net.http_post with a header that includes the service role key.
  -- But wait, where do we get the service role key? 
  -- In Supabase, you can store secrets in the vault or just use an environment variable if it's available in PL/pgSQL.
  -- For local development, it's usually better to use a dedicated function that has access to these.
  
  -- Alternatively, we can use Supabase Webhooks which are easier to set up for this.
  -- But since we are writing a migration, we'll use a trigger.
  
  -- Let's assume we can get the service role key from a table or vault.
  -- For now, let's use a simpler approach: a trigger that inserts into a 'job_queue' table,
  -- and a worker (edge function or cron) that processes the queue.
  -- BUT the plan said "Database trigger or Edge Function on-roster-published".
  
  -- If we use net.http_post, we need the service role key.
  -- Let's see if we can use the `pg_net` with the `supabase_url` and `supabase_service_role_key`.
  
  -- If this is running in Supabase cloud, the service role key is not directly accessible in SQL.
  -- The recommended way to call Edge Functions from Postgres is via `net.http_post`.
  
  if (NEW.status = 'published' and (OLD.status is null or OLD.status <> 'published')) then
    perform
      net.http_post(
        url := supabase_url || '/functions/v1/on-roster-published',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('vault.service_role_key', true) -- This is a common way to store it
        ),
        body := jsonb_build_object('roster_id', NEW.id)
      );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger on rosters table
drop trigger if exists trigger_on_roster_published on rosters;
create trigger trigger_on_roster_published
after update on rosters
for each row
execute function call_on_roster_published();

-- Enable pg_cron extension
create extension if not exists "pg_cron";

-- Schedule the shift-reminder function to run every 15 minutes
-- Note: We need to use the service role key here too.
select
  cron.schedule(
    'shift-reminder-cron',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'http://kong:8000/functions/v1/shift-reminder',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('vault.service_role_key', true)
        ),
        body := '{}'::jsonb
      );
    $$
  );

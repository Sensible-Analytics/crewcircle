-- Add billing-related columns to tenants table
alter table tenants
add column stripe_customer_id text,
add column stripe_subscription_id text,
add column subscription_status text,
add column current_period_end timestamptz;

-- Add index for stripe_customer_id
create index idx_tenants_stripe_customer_id on tenants(stripe_customer_id);

-- Create a table to track active employee count per month for metered billing
-- Though we can just count active profiles, this helps with history.
create table tenant_usage_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  employee_count integer not null,
  reported_to_stripe_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_tenant_usage_tenant_id on tenant_usage_records(tenant_id);
create index idx_tenant_usage_period on tenant_usage_records(billing_period_start, billing_period_end);

-- Enable RLS on usage records
alter table tenant_usage_records enable row level security;

create policy "Users can only see usage records from their tenant" on tenant_usage_records
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and tenant_id = tenant_usage_records.tenant_id
    )
  );

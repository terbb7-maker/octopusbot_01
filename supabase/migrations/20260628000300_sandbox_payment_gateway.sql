create type public.payment_environment as enum ('production', 'sandbox');
create type public.payment_gateway_provider as enum (
  'sandbox',
  'pushinpay',
  'bspay',
  'gothampay',
  'ativopay',
  'woovi'
);
create type public.sandbox_payment_result as enum (
  'always_approve',
  'always_pending'
);

create table public.workspace_payment_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  provider public.payment_gateway_provider not null default 'sandbox',
  sandbox_result public.sandbox_payment_result not null default 'always_approve',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workspace_payment_settings_sandbox_only check (provider = 'sandbox')
);

alter table public.payments
  add column if not exists environment public.payment_environment not null default 'production';

alter table public.pix_charges
  add column if not exists environment public.payment_environment not null default 'production';

alter table public.payment_events
  add column if not exists environment public.payment_environment not null default 'production';

alter table public.flow_checkouts
  add column if not exists provider public.payment_gateway_provider not null default 'sandbox',
  add column if not exists environment public.payment_environment not null default 'sandbox';

create index if not exists payments_environment_idx on public.payments (environment);
create index if not exists payments_workspace_environment_status_idx
  on public.payments (workspace_id, environment, status);
create index if not exists pix_charges_environment_idx on public.pix_charges (environment);
create index if not exists pix_charges_workspace_environment_status_idx
  on public.pix_charges (workspace_id, environment, status);
create index if not exists payment_events_environment_idx on public.payment_events (environment);
create index if not exists flow_checkouts_environment_idx on public.flow_checkouts (environment);
create index if not exists flow_checkouts_provider_idx on public.flow_checkouts (provider);

create trigger workspace_payment_settings_set_updated_at
before update on public.workspace_payment_settings
for each row execute function public.set_updated_at();

alter table public.workspace_payment_settings enable row level security;

revoke all on public.workspace_payment_settings from anon, authenticated;
grant select, insert, update on public.workspace_payment_settings to authenticated;

create policy workspace_payment_settings_select_member
on public.workspace_payment_settings
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy workspace_payment_settings_insert_editor
on public.workspace_payment_settings
for insert
to authenticated
with check (app_private.can_edit_workspace_content(workspace_id));

create policy workspace_payment_settings_update_editor
on public.workspace_payment_settings
for update
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

create or replace view public.flow_revenue_stats
with (security_invoker = true) as
select
  workspace_id,
  flow_id,
  flow_plan_id,
  revenue_kind,
  count(*) filter (where status = 'approved') as paid_count,
  coalesce(sum(amount_cents) filter (where status = 'approved'), 0) as revenue_cents,
  count(*) as payment_count,
  avg(extract(epoch from (approved_at - created_at))) filter (where status = 'approved') as avg_seconds_to_payment
from public.payments
where flow_id is not null
  and environment = 'production'
group by workspace_id, flow_id, flow_plan_id, revenue_kind;

grant select on public.flow_revenue_stats to authenticated;

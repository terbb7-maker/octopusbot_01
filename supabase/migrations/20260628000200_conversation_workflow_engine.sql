alter table public.flow_sessions
  add column if not exists session_key text,
  add column if not exists telegram_user_external_id bigint,
  add column if not exists telegram_chat_external_id bigint,
  add column if not exists lead_id uuid,
  add column if not exists current_step text not null default 'started',
  add column if not exists current_offer text,
  add column if not exists selected_plan_id uuid,
  add column if not exists selected_order_bump_id text,
  add column if not exists selected_upsell_id text,
  add column if not exists selected_downsell_id text,
  add column if not exists payment_id uuid,
  add column if not exists payment_status public.payment_status not null default 'pending',
  add column if not exists conversation_status text not null default 'active',
  add column if not exists last_interaction_at timestamptz not null default now();

alter table public.flow_sessions
  add constraint flow_sessions_lead_workspace_fkey
    foreign key (lead_id, telegram_bot_id, workspace_id)
    references public.telegram_chats (id, telegram_bot_id, workspace_id)
    on delete set null (lead_id);

alter table public.flow_sessions
  add constraint flow_sessions_payment_fkey
    foreign key (payment_id)
    references public.payments (id)
    on delete set null;

alter table public.flow_sessions
  add constraint flow_sessions_selected_plan_fkey
    foreign key (selected_plan_id)
    references public.flow_plans (id)
    on delete set null;

alter table public.flow_sessions
  add constraint flow_sessions_conversation_status_check
    check (conversation_status in ('active', 'waiting_payment', 'paid', 'completed', 'abandoned', 'expired', 'failed'));

create unique index if not exists flow_sessions_session_key_unique_idx
  on public.flow_sessions (session_key)
  where session_key is not null;

create index if not exists flow_sessions_workspace_bot_external_chat_idx
  on public.flow_sessions (workspace_id, telegram_bot_id, telegram_chat_external_id);

create index if not exists flow_sessions_selected_plan_id_idx
  on public.flow_sessions (selected_plan_id);

create index if not exists flow_sessions_payment_id_idx
  on public.flow_sessions (payment_id);

create index if not exists flow_sessions_conversation_status_idx
  on public.flow_sessions (conversation_status);

create table public.flow_checkouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  session_id uuid not null,
  flow_id uuid not null,
  flow_version_id uuid not null,
  telegram_bot_id uuid not null,
  lead_id uuid,
  plan_id uuid not null,
  order_bump_id text,
  upsell_id text,
  downsell_id text,
  subtotal_cents integer not null,
  order_bump_cents integer not null default 0,
  total_cents integer not null,
  currency text not null default 'BRL',
  payment_id uuid,
  payment_status public.payment_status not null default 'pending',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_checkouts_session_workspace_fkey
    foreign key (session_id, workspace_id)
    references public.flow_sessions (id, workspace_id)
    on delete cascade,
  constraint flow_checkouts_version_workspace_fkey
    foreign key (flow_version_id, flow_id, workspace_id)
    references public.flow_versions (id, flow_id, workspace_id)
    on delete restrict,
  constraint flow_checkouts_bot_workspace_fkey
    foreign key (telegram_bot_id, workspace_id)
    references public.telegram_bots (id, workspace_id)
    on delete restrict,
  constraint flow_checkouts_lead_workspace_fkey
    foreign key (lead_id, telegram_bot_id, workspace_id)
    references public.telegram_chats (id, telegram_bot_id, workspace_id)
    on delete set null (lead_id),
  constraint flow_checkouts_plan_fkey
    foreign key (plan_id)
    references public.flow_plans (id)
    on delete restrict,
  constraint flow_checkouts_payment_fkey
    foreign key (payment_id)
    references public.payments (id)
    on delete set null,
  constraint flow_checkouts_currency_brl check (currency = 'BRL'),
  constraint flow_checkouts_amounts_non_negative check (
    subtotal_cents >= 0 and order_bump_cents >= 0 and total_cents >= 0
  ),
  constraint flow_checkouts_status_check check (
    status in ('draft', 'payment_created', 'paid', 'expired', 'cancelled', 'failed')
  )
);

alter table public.payments
  add column if not exists checkout_id uuid,
  add column if not exists session_id uuid,
  add column if not exists revenue_kind text not null default 'plan';

alter table public.payments
  add constraint payments_checkout_fkey
    foreign key (checkout_id)
    references public.flow_checkouts (id)
    on delete set null;

alter table public.payments
  add constraint payments_session_fkey
    foreign key (session_id)
    references public.flow_sessions (id)
    on delete set null;

alter table public.payments
  add constraint payments_revenue_kind_check
    check (revenue_kind in ('plan', 'order_bump', 'upsell', 'downsell', 'bundle'));

create index flow_checkouts_workspace_id_idx on public.flow_checkouts (workspace_id);
create index flow_checkouts_session_id_idx on public.flow_checkouts (session_id);
create index flow_checkouts_flow_id_idx on public.flow_checkouts (flow_id);
create index flow_checkouts_version_id_idx on public.flow_checkouts (flow_version_id);
create index flow_checkouts_bot_id_idx on public.flow_checkouts (telegram_bot_id);
create index flow_checkouts_lead_id_idx on public.flow_checkouts (lead_id);
create index flow_checkouts_plan_id_idx on public.flow_checkouts (plan_id);
create index flow_checkouts_payment_id_idx on public.flow_checkouts (payment_id);
create index flow_checkouts_status_idx on public.flow_checkouts (status);
create index flow_checkouts_created_at_idx on public.flow_checkouts (created_at);
create index payments_checkout_id_idx on public.payments (checkout_id);
create index payments_session_id_idx on public.payments (session_id);
create index payments_revenue_kind_idx on public.payments (revenue_kind);

create trigger flow_checkouts_set_updated_at
before update on public.flow_checkouts
for each row execute function public.set_updated_at();

alter table public.flow_checkouts enable row level security;

revoke all on public.flow_checkouts from anon, authenticated;
grant select, insert, update on public.flow_checkouts to authenticated;

create policy flow_checkouts_select_member
on public.flow_checkouts
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_checkouts_insert_editor
on public.flow_checkouts
for insert
to authenticated
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_checkouts_update_editor
on public.flow_checkouts
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
group by workspace_id, flow_id, flow_plan_id, revenue_kind;

grant select on public.flow_revenue_stats to authenticated;

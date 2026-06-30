create type public.flow_offer_delay_unit as enum ('seconds', 'minutes');
create type public.flow_offer_button_color as enum (
  'auto',
  'blue',
  'green',
  'red'
);
create type public.flow_offer_order_bump_mode as enum (
  'none',
  'global',
  'exclusive'
);

create table public.flow_upsell_sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id uuid not null,
  sequence_key text not null,
  order_index integer not null default 0,
  delay_value numeric not null default 0,
  delay_unit public.flow_offer_delay_unit not null default 'minutes',
  message text not null default '',
  required boolean not null default false,
  accept_button_text text not null default '✅ Quero aproveitar',
  accept_button_color public.flow_offer_button_color not null default 'auto',
  decline_button_text text,
  decline_button_color public.flow_offer_button_color not null default 'auto',
  media_type text,
  media_group boolean not null default false,
  order_bump_mode public.flow_offer_order_bump_mode not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_upsell_sequences_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade,
  constraint flow_upsell_sequences_key_unique
    unique (flow_id, sequence_key)
);

create table public.flow_upsell_sequence_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id uuid not null,
  upsell_sequence_id uuid not null references public.flow_upsell_sequences (id) on delete cascade,
  flow_plan_id uuid not null references public.flow_plans (id) on delete cascade,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),

  constraint flow_upsell_sequence_plans_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade,
  constraint flow_upsell_sequence_plans_unique
    unique (upsell_sequence_id, flow_plan_id)
);

create table public.flow_upsell_sequence_media (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id uuid not null,
  upsell_sequence_id uuid not null references public.flow_upsell_sequences (id) on delete cascade,
  media_kind text not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  order_index integer not null default 0,
  grouped boolean not null default false,
  created_at timestamptz not null default now(),

  constraint flow_upsell_sequence_media_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade
);

create index flow_upsell_sequences_workspace_id_idx
  on public.flow_upsell_sequences (workspace_id);
create index flow_upsell_sequences_flow_id_idx
  on public.flow_upsell_sequences (flow_id);
create index flow_upsell_sequence_plans_workspace_id_idx
  on public.flow_upsell_sequence_plans (workspace_id);
create index flow_upsell_sequence_plans_flow_id_idx
  on public.flow_upsell_sequence_plans (flow_id);
create index flow_upsell_sequence_media_workspace_id_idx
  on public.flow_upsell_sequence_media (workspace_id);
create index flow_upsell_sequence_media_flow_id_idx
  on public.flow_upsell_sequence_media (flow_id);
create index flow_upsell_sequence_media_sequence_id_idx
  on public.flow_upsell_sequence_media (upsell_sequence_id);

create trigger flow_upsell_sequences_set_updated_at
before update on public.flow_upsell_sequences
for each row execute function public.set_updated_at();

alter table public.flow_upsell_sequences enable row level security;
alter table public.flow_upsell_sequence_plans enable row level security;
alter table public.flow_upsell_sequence_media enable row level security;

revoke all on public.flow_upsell_sequences from anon, authenticated;
revoke all on public.flow_upsell_sequence_plans from anon, authenticated;
revoke all on public.flow_upsell_sequence_media from anon, authenticated;
grant select, insert, update, delete on public.flow_upsell_sequences to authenticated;
grant select, insert, update, delete on public.flow_upsell_sequence_plans to authenticated;
grant select, insert, update, delete on public.flow_upsell_sequence_media to authenticated;

create policy flow_upsell_sequences_select_member
on public.flow_upsell_sequences
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_upsell_sequences_write_editor
on public.flow_upsell_sequences
for all
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_upsell_sequence_plans_select_member
on public.flow_upsell_sequence_plans
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_upsell_sequence_plans_write_editor
on public.flow_upsell_sequence_plans
for all
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_upsell_sequence_media_select_member
on public.flow_upsell_sequence_media
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_upsell_sequence_media_write_editor
on public.flow_upsell_sequence_media
for all
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

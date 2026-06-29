create table public.flow_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id uuid not null,
  order_index integer not null default 0,
  name text not null default '',
  price_cents integer not null default 0,
  billing_type text not null default 'lifetime',
  button_color text not null default 'default',
  button_text text not null default 'Escolher plano',
  image_name text,
  image_path text,
  image_type text,
  delivery_type text not null default 'default',
  telegram_destination_id text,
  delivery_url text,
  delivery_message text,
  use_default_delivery boolean not null default true,
  use_global_order_bump boolean not null default true,
  order_bump_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_plans_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade,
  constraint flow_plans_price_non_negative check (price_cents >= 0),
  constraint flow_plans_order_non_negative check (order_index >= 0),
  constraint flow_plans_name_length check (char_length(name) <= 80),
  constraint flow_plans_billing_type_check check (
    billing_type in ('lifetime', 'monthly', 'quarterly', 'semiannual', 'annual')
  ),
  constraint flow_plans_button_color_check check (
    button_color in ('default', 'blue', 'green', 'red')
  ),
  constraint flow_plans_delivery_type_check check (
    delivery_type in (
      'default',
      'telegram_group',
      'telegram_channel',
      'link',
      'custom_message'
    )
  )
);

create table public.flow_default_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id uuid not null,
  delivery_type text not null default 'custom_message',
  telegram_destination_id text,
  delivery_url text,
  delivery_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_default_deliveries_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade,
  constraint flow_default_deliveries_flow_unique unique (flow_id),
  constraint flow_default_deliveries_delivery_type_check check (
    delivery_type in ('telegram_group', 'telegram_channel', 'link', 'custom_message')
  )
);

create table public.flow_plan_price_variations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id uuid not null,
  enabled boolean not null default false,
  cent_range_start integer not null default 1,
  cent_range_end integer not null default 99,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_plan_price_variations_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade,
  constraint flow_plan_price_variations_flow_unique unique (flow_id),
  constraint flow_plan_price_variations_cent_range_check check (
    cent_range_start >= 0
    and cent_range_end <= 99
    and cent_range_start <= cent_range_end
  )
);

alter table public.payments
  add column if not exists flow_id uuid,
  add column if not exists flow_plan_id uuid;

alter table public.payments
  add constraint payments_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete set null (flow_id);

alter table public.payments
  add constraint payments_flow_plan_fkey
    foreign key (flow_plan_id)
    references public.flow_plans (id)
    on delete set null;

create index flow_plans_workspace_id_idx on public.flow_plans (workspace_id);
create index flow_plans_flow_id_idx on public.flow_plans (flow_id);
create index flow_plans_flow_order_idx on public.flow_plans (flow_id, order_index);
create index flow_plans_active_idx on public.flow_plans (active);
create index flow_default_deliveries_workspace_id_idx on public.flow_default_deliveries (workspace_id);
create index flow_default_deliveries_flow_id_idx on public.flow_default_deliveries (flow_id);
create index flow_plan_price_variations_workspace_id_idx on public.flow_plan_price_variations (workspace_id);
create index flow_plan_price_variations_flow_id_idx on public.flow_plan_price_variations (flow_id);
create index payments_flow_id_idx on public.payments (flow_id);
create index payments_flow_plan_id_idx on public.payments (flow_plan_id);
create index payments_metadata_plan_id_idx
  on public.payments ((metadata->>'plan_id'))
  where metadata ? 'plan_id';

create trigger flow_plans_set_updated_at
before update on public.flow_plans
for each row execute function public.set_updated_at();

create trigger flow_default_deliveries_set_updated_at
before update on public.flow_default_deliveries
for each row execute function public.set_updated_at();

create trigger flow_plan_price_variations_set_updated_at
before update on public.flow_plan_price_variations
for each row execute function public.set_updated_at();

alter table public.flow_plans enable row level security;
alter table public.flow_default_deliveries enable row level security;
alter table public.flow_plan_price_variations enable row level security;

create policy flow_plans_select_member
on public.flow_plans
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_plans_insert_editor
on public.flow_plans
for insert
to authenticated
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_plans_update_editor
on public.flow_plans
for update
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_plans_delete_editor
on public.flow_plans
for delete
to authenticated
using (app_private.can_edit_workspace_content(workspace_id));

create policy flow_default_deliveries_select_member
on public.flow_default_deliveries
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_default_deliveries_insert_editor
on public.flow_default_deliveries
for insert
to authenticated
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_default_deliveries_update_editor
on public.flow_default_deliveries
for update
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_default_deliveries_delete_editor
on public.flow_default_deliveries
for delete
to authenticated
using (app_private.can_edit_workspace_content(workspace_id));

create policy flow_plan_price_variations_select_member
on public.flow_plan_price_variations
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_plan_price_variations_insert_editor
on public.flow_plan_price_variations
for insert
to authenticated
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_plan_price_variations_update_editor
on public.flow_plan_price_variations
for update
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

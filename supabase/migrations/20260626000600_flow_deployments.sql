create table public.flow_bot_bindings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  telegram_bot_id uuid not null,
  flow_id uuid not null,
  status public.flow_binding_status not null default 'active',
  entrypoint text not null default 'default',
  trigger_config jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_bot_bindings_bot_workspace_fkey
    foreign key (telegram_bot_id, workspace_id)
    references public.telegram_bots (id, workspace_id)
    on delete cascade,
  constraint flow_bot_bindings_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade,
  constraint flow_bot_bindings_entrypoint_not_blank check (length(trim(entrypoint)) > 0),
  constraint flow_bot_bindings_trigger_config_object check (jsonb_typeof(trigger_config) = 'object'),
  constraint flow_bot_bindings_archived_requires_deleted_at check (status <> 'archived' or deleted_at is not null)
);

alter table public.flow_bot_bindings
  add constraint flow_bot_bindings_id_workspace_unique unique (id, workspace_id),
  add constraint flow_bot_bindings_id_flow_workspace_unique unique (id, flow_id, workspace_id);

create unique index flow_bot_bindings_one_active_entrypoint_idx
  on public.flow_bot_bindings (telegram_bot_id, lower(entrypoint))
  where status = 'active' and deleted_at is null;

create table public.flow_deployments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  binding_id uuid not null,
  flow_id uuid not null,
  status public.flow_deployment_status not null default 'paused',
  strategy public.flow_deployment_strategy not null default 'single',
  activated_at timestamptz,
  retired_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_deployments_binding_flow_workspace_fkey
    foreign key (binding_id, flow_id, workspace_id)
    references public.flow_bot_bindings (id, flow_id, workspace_id)
    on delete cascade,
  constraint flow_deployments_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint flow_deployments_active_requires_activated_at check (status <> 'active' or activated_at is not null),
  constraint flow_deployments_retired_requires_retired_at check (status <> 'retired' or retired_at is not null)
);

alter table public.flow_deployments
  add constraint flow_deployments_id_workspace_unique unique (id, workspace_id),
  add constraint flow_deployments_id_flow_workspace_unique unique (id, flow_id, workspace_id);

create unique index flow_deployments_one_active_per_binding_idx
  on public.flow_deployments (binding_id)
  where status = 'active';

create table public.flow_deployment_variants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  deployment_id uuid not null,
  flow_id uuid not null,
  flow_version_id uuid not null,
  name text not null,
  weight_basis_points integer not null default 10000,
  is_control boolean not null default false,
  created_at timestamptz not null default now(),

  constraint flow_deployment_variants_deployment_workspace_fkey
    foreign key (deployment_id, flow_id, workspace_id)
    references public.flow_deployments (id, flow_id, workspace_id)
    on delete cascade,
  constraint flow_deployment_variants_version_workspace_fkey
    foreign key (flow_version_id, flow_id, workspace_id)
    references public.flow_versions (id, flow_id, workspace_id)
    on delete restrict,
  constraint flow_deployment_variants_name_not_blank check (length(trim(name)) > 0),
  constraint flow_deployment_variants_weight_range check (
    weight_basis_points >= 0
    and weight_basis_points <= 10000
  )
);

alter table public.flow_deployment_variants
  add constraint flow_deployment_variants_id_workspace_unique unique (id, workspace_id),
  add constraint flow_deployment_variants_id_deployment_flow_workspace_unique unique (
    id,
    deployment_id,
    flow_id,
    workspace_id
  ),
  add constraint flow_deployment_variants_deployment_name_unique unique (deployment_id, name);

create unique index flow_deployment_variants_one_control_idx
  on public.flow_deployment_variants (deployment_id)
  where is_control;

create index flow_bot_bindings_workspace_id_idx on public.flow_bot_bindings (workspace_id);
create index flow_bot_bindings_bot_id_idx on public.flow_bot_bindings (telegram_bot_id);
create index flow_bot_bindings_flow_id_idx on public.flow_bot_bindings (flow_id);
create index flow_bot_bindings_status_idx on public.flow_bot_bindings (status);
create index flow_bot_bindings_deleted_at_idx on public.flow_bot_bindings (deleted_at);

create index flow_deployments_workspace_id_idx on public.flow_deployments (workspace_id);
create index flow_deployments_binding_id_idx on public.flow_deployments (binding_id);
create index flow_deployments_flow_id_idx on public.flow_deployments (flow_id);
create index flow_deployments_status_idx on public.flow_deployments (status);
create index flow_deployments_strategy_idx on public.flow_deployments (strategy);
create index flow_deployments_activated_at_idx on public.flow_deployments (activated_at);

create index flow_deployment_variants_workspace_id_idx on public.flow_deployment_variants (workspace_id);
create index flow_deployment_variants_deployment_id_idx on public.flow_deployment_variants (deployment_id);
create index flow_deployment_variants_version_id_idx on public.flow_deployment_variants (flow_version_id);

create trigger flow_bot_bindings_set_updated_at
before update on public.flow_bot_bindings
for each row execute function public.set_updated_at();

create trigger flow_deployments_set_updated_at
before update on public.flow_deployments
for each row execute function public.set_updated_at();

create or replace function app_private.ensure_flow_deployment_variant_is_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  version_status public.flow_version_status;
begin
  select status
    into version_status
  from public.flow_versions
  where id = new.flow_version_id
    and flow_id = new.flow_id
    and workspace_id = new.workspace_id;

  if version_status is distinct from 'published' then
    raise exception 'Flow deployment variants require published flow versions';
  end if;

  return new;
end;
$$;

create trigger flow_deployment_variants_require_published_version
before insert or update on public.flow_deployment_variants
for each row execute function app_private.ensure_flow_deployment_variant_is_published();

create or replace function app_private.validate_flow_deployment_weights(target_deployment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  variant_count integer;
  total_weight integer;
begin
  select count(*), coalesce(sum(weight_basis_points), 0)
    into variant_count, total_weight
  from public.flow_deployment_variants
  where deployment_id = target_deployment_id;

  if variant_count = 0 then
    raise exception 'Active flow deployments require at least one variant';
  end if;

  if total_weight <> 10000 then
    raise exception 'Flow deployment variant weights must total 10000 basis points';
  end if;
end;
$$;

create or replace function app_private.ensure_active_flow_deployment_is_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    perform app_private.validate_flow_deployment_weights(new.id);
  end if;

  return new;
end;
$$;

create trigger flow_deployments_validate_active_weights
before insert or update on public.flow_deployments
for each row execute function app_private.ensure_active_flow_deployment_is_ready();

create or replace function app_private.ensure_active_flow_variant_weights()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deployment_id uuid;
  deployment_status public.flow_deployment_status;
begin
  if tg_op = 'DELETE' then
    target_deployment_id := old.deployment_id;
  else
    target_deployment_id := new.deployment_id;
  end if;

  select status
    into deployment_status
  from public.flow_deployments
  where id = target_deployment_id;

  if deployment_status = 'active' then
    perform app_private.validate_flow_deployment_weights(target_deployment_id);
  end if;

  return null;
end;
$$;

create trigger flow_deployment_variants_validate_active_weights
after insert or update or delete on public.flow_deployment_variants
for each row execute function app_private.ensure_active_flow_variant_weights();

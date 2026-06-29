create table public.flows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  description text,
  status public.flow_status not null default 'draft',
  active_version_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flows_name_not_blank check (length(trim(name)) > 0),
  constraint flows_description_not_blank check (description is null or length(trim(description)) > 0),
  constraint flows_archived_requires_deleted_at check (status <> 'archived' or deleted_at is not null)
);

alter table public.flows
  add constraint flows_id_workspace_unique unique (id, workspace_id);

create table public.flow_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id uuid not null,
  version_number integer not null,
  status public.flow_version_status not null default 'draft',
  graph_schema_version integer not null default 1,
  graph_json jsonb not null default '{}'::jsonb,
  compiled_graph_json jsonb not null default '{}'::jsonb,
  validation_status public.flow_validation_status not null default 'pending',
  validation_errors jsonb not null default '[]'::jsonb,
  checksum text,
  parent_version_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  published_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_versions_flow_workspace_fkey
    foreign key (flow_id, workspace_id)
    references public.flows (id, workspace_id)
    on delete cascade,
  constraint flow_versions_version_positive check (version_number > 0),
  constraint flow_versions_graph_schema_positive check (graph_schema_version > 0),
  constraint flow_versions_graph_object check (jsonb_typeof(graph_json) = 'object'),
  constraint flow_versions_compiled_graph_object check (jsonb_typeof(compiled_graph_json) = 'object'),
  constraint flow_versions_validation_errors_array check (jsonb_typeof(validation_errors) = 'array'),
  constraint flow_versions_published_at_required check (status <> 'published' or published_at is not null),
  constraint flow_versions_published_checksum_required check (
    status <> 'published'
    or length(trim(coalesce(checksum, ''))) > 0
  )
);

alter table public.flow_versions
  add constraint flow_versions_id_workspace_unique unique (id, workspace_id),
  add constraint flow_versions_id_flow_workspace_unique unique (id, flow_id, workspace_id),
  add constraint flow_versions_flow_version_unique unique (flow_id, version_number);

alter table public.flow_versions
  add constraint flow_versions_parent_flow_workspace_fkey
    foreign key (parent_version_id, flow_id, workspace_id)
    references public.flow_versions (id, flow_id, workspace_id)
    on delete restrict;

alter table public.flows
  add constraint flows_active_version_flow_workspace_fkey
    foreign key (active_version_id, id, workspace_id)
    references public.flow_versions (id, flow_id, workspace_id)
    on delete restrict;

create unique index flow_versions_one_draft_per_flow_idx
  on public.flow_versions (flow_id)
  where status = 'draft';

create index flows_workspace_id_idx on public.flows (workspace_id);
create index flows_status_idx on public.flows (status);
create index flows_workspace_status_idx on public.flows (workspace_id, status);
create index flows_active_version_id_idx on public.flows (active_version_id);
create index flows_deleted_at_idx on public.flows (deleted_at);
create index flows_created_at_idx on public.flows (created_at);
create index flows_name_idx on public.flows (lower(name));

create index flow_versions_workspace_id_idx on public.flow_versions (workspace_id);
create index flow_versions_flow_id_idx on public.flow_versions (flow_id);
create index flow_versions_status_idx on public.flow_versions (status);
create index flow_versions_validation_status_idx on public.flow_versions (validation_status);
create index flow_versions_parent_version_id_idx on public.flow_versions (parent_version_id);
create index flow_versions_published_at_idx on public.flow_versions (published_at);
create index flow_versions_created_at_idx on public.flow_versions (created_at);

create trigger flows_set_updated_at
before update on public.flows
for each row execute function public.set_updated_at();

create or replace function app_private.prevent_flow_protected_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.active_version_id is distinct from old.active_version_id
    or new.status is distinct from old.status
    or new.deleted_at is distinct from old.deleted_at
  )
    and not app_private.can_manage_workspace(old.workspace_id)
  then
    raise exception 'Only workspace managers can publish, pause, activate, or archive flows';
  end if;

  return new;
end;
$$;

create trigger flows_prevent_protected_updates
before update on public.flows
for each row execute function app_private.prevent_flow_protected_updates();

create trigger flow_versions_set_updated_at
before update on public.flow_versions
for each row execute function public.set_updated_at();

create or replace function app_private.prevent_locked_flow_version_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('published', 'deprecated', 'archived')
    and (
      new.workspace_id is distinct from old.workspace_id
      or new.flow_id is distinct from old.flow_id
      or new.version_number is distinct from old.version_number
      or new.graph_schema_version is distinct from old.graph_schema_version
      or new.graph_json is distinct from old.graph_json
      or new.compiled_graph_json is distinct from old.compiled_graph_json
      or new.validation_status is distinct from old.validation_status
      or new.validation_errors is distinct from old.validation_errors
      or new.checksum is distinct from old.checksum
      or new.parent_version_id is distinct from old.parent_version_id
      or new.created_by is distinct from old.created_by
      or new.published_by is distinct from old.published_by
      or new.published_at is distinct from old.published_at
    )
  then
    raise exception 'Locked flow versions cannot be mutated';
  end if;

  if old.status = 'published' and new.status not in ('published', 'deprecated', 'archived') then
    raise exception 'Published flow versions cannot return to draft';
  end if;

  return new;
end;
$$;

create trigger flow_versions_prevent_locked_mutation
before update on public.flow_versions
for each row execute function app_private.prevent_locked_flow_version_mutation();

create table public.flow_experiments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  deployment_id uuid not null,
  name text not null,
  status public.flow_experiment_status not null default 'draft',
  goal_metric text not null,
  config jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_experiments_deployment_workspace_fkey
    foreign key (deployment_id, workspace_id)
    references public.flow_deployments (id, workspace_id)
    on delete cascade,
  constraint flow_experiments_name_not_blank check (length(trim(name)) > 0),
  constraint flow_experiments_goal_metric_not_blank check (length(trim(goal_metric)) > 0),
  constraint flow_experiments_config_object check (jsonb_typeof(config) = 'object'),
  constraint flow_experiments_running_started_at_required check (status <> 'running' or started_at is not null),
  constraint flow_experiments_completed_ended_at_required check (status <> 'completed' or ended_at is not null)
);

alter table public.flow_experiments
  add constraint flow_experiments_id_workspace_unique unique (id, workspace_id);

create table public.workspace_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null,
  name text not null,
  status public.workspace_integration_status not null default 'active',
  encrypted_credentials text,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workspace_integrations_provider_not_blank check (length(trim(provider)) > 0),
  constraint workspace_integrations_name_not_blank check (length(trim(name)) > 0),
  constraint workspace_integrations_config_object check (jsonb_typeof(config) = 'object')
);

alter table public.workspace_integrations
  add constraint workspace_integrations_id_workspace_unique unique (id, workspace_id),
  add constraint workspace_integrations_workspace_provider_name_unique unique (
    workspace_id,
    provider,
    name
  );

create table public.flow_ai_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  provider text not null,
  model text not null,
  system_prompt text,
  config jsonb not null default '{}'::jsonb,
  status public.flow_ai_profile_status not null default 'active',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flow_ai_profiles_name_not_blank check (length(trim(name)) > 0),
  constraint flow_ai_profiles_provider_not_blank check (length(trim(provider)) > 0),
  constraint flow_ai_profiles_model_not_blank check (length(trim(model)) > 0),
  constraint flow_ai_profiles_system_prompt_not_blank check (
    system_prompt is null
    or length(trim(system_prompt)) > 0
  ),
  constraint flow_ai_profiles_config_object check (jsonb_typeof(config) = 'object')
);

alter table public.flow_ai_profiles
  add constraint flow_ai_profiles_id_workspace_unique unique (id, workspace_id),
  add constraint flow_ai_profiles_workspace_name_unique unique (workspace_id, name);

create index flow_experiments_workspace_id_idx on public.flow_experiments (workspace_id);
create index flow_experiments_deployment_id_idx on public.flow_experiments (deployment_id);
create index flow_experiments_status_idx on public.flow_experiments (status);
create index flow_experiments_goal_metric_idx on public.flow_experiments (goal_metric);
create index flow_experiments_started_at_idx on public.flow_experiments (started_at);

create index workspace_integrations_workspace_id_idx on public.workspace_integrations (workspace_id);
create index workspace_integrations_provider_idx on public.workspace_integrations (provider);
create index workspace_integrations_status_idx on public.workspace_integrations (status);

create index flow_ai_profiles_workspace_id_idx on public.flow_ai_profiles (workspace_id);
create index flow_ai_profiles_provider_idx on public.flow_ai_profiles (provider);
create index flow_ai_profiles_status_idx on public.flow_ai_profiles (status);

create trigger flow_experiments_set_updated_at
before update on public.flow_experiments
for each row execute function public.set_updated_at();

create trigger workspace_integrations_set_updated_at
before update on public.workspace_integrations
for each row execute function public.set_updated_at();

create trigger flow_ai_profiles_set_updated_at
before update on public.flow_ai_profiles
for each row execute function public.set_updated_at();

create table public.flow_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  deployment_id uuid not null,
  variant_id uuid not null,
  flow_id uuid not null,
  flow_version_id uuid not null,
  telegram_bot_id uuid not null,
  telegram_chat_id uuid,
  status public.flow_session_status not null default 'active',
  current_node_key text,
  context jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  last_event_at timestamptz,
  ended_at timestamptz,

  constraint flow_sessions_deployment_workspace_fkey
    foreign key (deployment_id, flow_id, workspace_id)
    references public.flow_deployments (id, flow_id, workspace_id)
    on delete restrict,
  constraint flow_sessions_variant_deployment_workspace_fkey
    foreign key (variant_id, deployment_id, flow_id, workspace_id)
    references public.flow_deployment_variants (
      id,
      deployment_id,
      flow_id,
      workspace_id
    )
    on delete restrict,
  constraint flow_sessions_version_workspace_fkey
    foreign key (flow_version_id, flow_id, workspace_id)
    references public.flow_versions (id, flow_id, workspace_id)
    on delete restrict,
  constraint flow_sessions_bot_workspace_fkey
    foreign key (telegram_bot_id, workspace_id)
    references public.telegram_bots (id, workspace_id)
    on delete restrict,
  constraint flow_sessions_chat_bot_workspace_fkey
    foreign key (telegram_chat_id, telegram_bot_id, workspace_id)
    references public.telegram_chats (id, telegram_bot_id, workspace_id)
    on delete restrict,
  constraint flow_sessions_context_object check (jsonb_typeof(context) = 'object'),
  constraint flow_sessions_ended_status_check check (
    ended_at is null
    or status in ('completed', 'abandoned', 'failed', 'cancelled')
  )
);

alter table public.flow_sessions
  add constraint flow_sessions_id_workspace_unique unique (id, workspace_id);

create table public.flow_run_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  session_id uuid not null,
  node_key text not null,
  node_type text not null,
  status public.flow_run_step_status not null default 'pending',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),

  constraint flow_run_steps_session_workspace_fkey
    foreign key (session_id, workspace_id)
    references public.flow_sessions (id, workspace_id)
    on delete cascade,
  constraint flow_run_steps_node_key_not_blank check (length(trim(node_key)) > 0),
  constraint flow_run_steps_node_type_not_blank check (length(trim(node_type)) > 0),
  constraint flow_run_steps_input_object check (jsonb_typeof(input) = 'object'),
  constraint flow_run_steps_output_object check (jsonb_typeof(output) = 'object'),
  constraint flow_run_steps_finished_status_check check (
    finished_at is null
    or status in ('completed', 'failed', 'skipped')
  )
);

create table public.flow_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  session_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint flow_events_session_workspace_fkey
    foreign key (session_id, workspace_id)
    references public.flow_sessions (id, workspace_id)
    on delete cascade,
  constraint flow_events_type_not_blank check (length(trim(event_type)) > 0),
  constraint flow_events_payload_object check (jsonb_typeof(payload) = 'object')
);

create index flow_sessions_workspace_id_idx on public.flow_sessions (workspace_id);
create index flow_sessions_deployment_id_idx on public.flow_sessions (deployment_id);
create index flow_sessions_variant_id_idx on public.flow_sessions (variant_id);
create index flow_sessions_flow_id_idx on public.flow_sessions (flow_id);
create index flow_sessions_version_id_idx on public.flow_sessions (flow_version_id);
create index flow_sessions_bot_id_idx on public.flow_sessions (telegram_bot_id);
create index flow_sessions_chat_id_idx on public.flow_sessions (telegram_chat_id);
create index flow_sessions_status_idx on public.flow_sessions (status);
create index flow_sessions_last_event_at_idx on public.flow_sessions (last_event_at);
create index flow_sessions_started_at_idx on public.flow_sessions (started_at);
create index flow_sessions_active_chat_idx
  on public.flow_sessions (workspace_id, telegram_bot_id, telegram_chat_id)
  where status = 'active';

create index flow_run_steps_workspace_id_idx on public.flow_run_steps (workspace_id);
create index flow_run_steps_session_id_idx on public.flow_run_steps (session_id);
create index flow_run_steps_node_key_idx on public.flow_run_steps (node_key);
create index flow_run_steps_node_type_idx on public.flow_run_steps (node_type);
create index flow_run_steps_status_idx on public.flow_run_steps (status);
create index flow_run_steps_created_at_idx on public.flow_run_steps (created_at);

create index flow_events_workspace_id_idx on public.flow_events (workspace_id);
create index flow_events_session_id_idx on public.flow_events (session_id);
create index flow_events_event_type_idx on public.flow_events (event_type);
create index flow_events_created_at_idx on public.flow_events (created_at);

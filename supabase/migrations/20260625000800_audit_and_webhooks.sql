create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint audit_logs_action_not_blank check (length(trim(action)) > 0),
  constraint audit_logs_entity_type_not_blank check (length(trim(entity_type)) > 0),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  source public.webhook_source not null,
  external_id text not null,
  event_type text,
  payload jsonb not null,
  headers jsonb,
  processing_status public.event_processing_status not null default 'received',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),

  constraint webhook_inbox_external_id_not_blank check (length(trim(external_id)) > 0),
  constraint webhook_inbox_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint webhook_inbox_headers_object check (headers is null or jsonb_typeof(headers) = 'object')
);

create index audit_logs_workspace_id_idx on public.audit_logs (workspace_id);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at);

create unique index webhook_inbox_source_external_unique_idx on public.webhook_inbox (source, external_id);
create index webhook_inbox_workspace_id_idx on public.webhook_inbox (workspace_id);
create index webhook_inbox_processing_status_idx on public.webhook_inbox (processing_status);
create index webhook_inbox_created_at_idx on public.webhook_inbox (created_at);

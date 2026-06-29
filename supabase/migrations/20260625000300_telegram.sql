create table public.telegram_bots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  bot_username text not null,
  bot_name text,
  bot_token_encrypted text not null,
  telegram_bot_external_id bigint not null,
  webhook_secret_hash text,
  webhook_status public.telegram_webhook_status not null default 'pending',
  status public.telegram_bot_status not null default 'active',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint telegram_bots_bot_username_not_blank check (length(trim(bot_username)) > 0),
  constraint telegram_bots_token_not_blank check (length(trim(bot_token_encrypted)) > 0)
);

create table public.telegram_chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  telegram_bot_id uuid not null references public.telegram_bots (id) on delete cascade,
  telegram_chat_external_id bigint not null,
  telegram_user_external_id bigint,
  username text,
  first_name text,
  last_name text,
  language_code text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.telegram_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  telegram_bot_id uuid not null references public.telegram_bots (id) on delete cascade,
  telegram_chat_id uuid references public.telegram_chats (id) on delete set null,
  update_id bigint not null,
  event_type text not null,
  payload jsonb not null,
  processing_status public.event_processing_status not null default 'received',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),

  constraint telegram_events_event_type_not_blank check (length(trim(event_type)) > 0),
  constraint telegram_events_payload_object check (jsonb_typeof(payload) = 'object')
);

create unique index telegram_bots_external_id_unique_idx on public.telegram_bots (telegram_bot_external_id);
create index telegram_bots_workspace_id_idx on public.telegram_bots (workspace_id);
create index telegram_bots_bot_username_idx on public.telegram_bots (lower(bot_username));
create index telegram_bots_status_idx on public.telegram_bots (status);
create index telegram_bots_webhook_status_idx on public.telegram_bots (webhook_status);

create unique index telegram_chats_bot_chat_unique_idx on public.telegram_chats (telegram_bot_id, telegram_chat_external_id);
create index telegram_chats_workspace_id_idx on public.telegram_chats (workspace_id);
create index telegram_chats_bot_id_idx on public.telegram_chats (telegram_bot_id);
create index telegram_chats_username_idx on public.telegram_chats (lower(username));
create index telegram_chats_last_message_at_idx on public.telegram_chats (last_message_at);

create unique index telegram_events_bot_update_unique_idx on public.telegram_events (telegram_bot_id, update_id);
create index telegram_events_workspace_id_idx on public.telegram_events (workspace_id);
create index telegram_events_bot_id_idx on public.telegram_events (telegram_bot_id);
create index telegram_events_chat_id_idx on public.telegram_events (telegram_chat_id);
create index telegram_events_processing_status_idx on public.telegram_events (processing_status);
create index telegram_events_created_at_idx on public.telegram_events (created_at);

create trigger telegram_bots_set_updated_at
before update on public.telegram_bots
for each row execute function public.set_updated_at();

create trigger telegram_chats_set_updated_at
before update on public.telegram_chats
for each row execute function public.set_updated_at();

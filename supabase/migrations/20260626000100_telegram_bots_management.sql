alter table public.telegram_bots
  add column if not exists bot_avatar_path text,
  add column if not exists deleted_at timestamptz;

create index if not exists telegram_bots_deleted_at_idx
  on public.telegram_bots (deleted_at);

grant select (bot_avatar_path, deleted_at) on public.telegram_bots to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'telegram-bot-avatars',
  'telegram-bot-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

grant insert (
  workspace_id,
  bot_username,
  bot_name,
  bot_token_encrypted,
  telegram_bot_external_id,
  webhook_secret_hash,
  webhook_status,
  status,
  last_verified_at,
  bot_avatar_path
) on public.telegram_bots to authenticated;

grant update (
  bot_username,
  bot_name,
  bot_token_encrypted,
  telegram_bot_external_id,
  webhook_secret_hash,
  webhook_status,
  status,
  last_verified_at,
  bot_avatar_path,
  deleted_at
) on public.telegram_bots to authenticated;

grant insert (workspace_id, actor_id, action, entity_type, entity_id, metadata)
  on public.audit_logs to authenticated;

drop policy if exists telegram_bots_insert_manager on public.telegram_bots;
create policy telegram_bots_insert_manager
on public.telegram_bots
for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

drop policy if exists telegram_bots_update_manager on public.telegram_bots;
create policy telegram_bots_update_manager
on public.telegram_bots
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

drop policy if exists audit_logs_insert_member on public.audit_logs;
create policy audit_logs_insert_member
on public.audit_logs
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and app_private.is_workspace_member(workspace_id)
);

drop policy if exists telegram_bot_avatars_storage_select_member on storage.objects;
create policy telegram_bot_avatars_storage_select_member
on storage.objects
for select
to authenticated
using (
  bucket_id = 'telegram-bot-avatars'
  and app_private.is_workspace_member_from_text((storage.foldername(name))[1])
);

drop policy if exists telegram_bot_avatars_storage_insert_member on storage.objects;
create policy telegram_bot_avatars_storage_insert_member
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'telegram-bot-avatars'
  and app_private.is_workspace_member_from_text((storage.foldername(name))[1])
);

drop policy if exists telegram_bot_avatars_storage_update_member on storage.objects;
create policy telegram_bot_avatars_storage_update_member
on storage.objects
for update
to authenticated
using (
  bucket_id = 'telegram-bot-avatars'
  and app_private.is_workspace_member_from_text((storage.foldername(name))[1])
)
with check (
  bucket_id = 'telegram-bot-avatars'
  and app_private.is_workspace_member_from_text((storage.foldername(name))[1])
);

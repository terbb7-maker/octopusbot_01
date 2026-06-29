create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
grant usage on schema public to authenticated;

create or replace function app_private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_workspace_id is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = target_workspace_id
        and wm.user_id = (select auth.uid())
        and wm.status = 'active'
    ),
    false
  );
$$;

create or replace function app_private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_workspace_id is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = target_workspace_id
        and wm.user_id = (select auth.uid())
        and wm.status = 'active'
        and wm.role in ('owner', 'admin')
    ),
    false
  );
$$;

create or replace function app_private.is_workspace_owner_record(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_workspace_id is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspaces w
      where w.id = target_workspace_id
        and w.owner_id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function app_private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_user_id is not null
    and (select auth.uid()) is not null
    and (
      target_user_id = (select auth.uid())
      or exists (
        select 1
        from public.workspace_members viewer_membership
        join public.workspace_members target_membership
          on target_membership.workspace_id = viewer_membership.workspace_id
        where viewer_membership.user_id = (select auth.uid())
          and viewer_membership.status = 'active'
          and target_membership.user_id = target_user_id
          and target_membership.status = 'active'
      )
    ),
    false
  );
$$;

create or replace function app_private.is_workspace_member_from_text(target_workspace_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  parsed_workspace_id uuid;
begin
  if target_workspace_id is null or length(trim(target_workspace_id)) = 0 then
    return false;
  end if;

  begin
    parsed_workspace_id := target_workspace_id::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;

  return app_private.is_workspace_member(parsed_workspace_id);
end;
$$;

revoke all on function app_private.is_workspace_member(uuid) from public;
revoke all on function app_private.can_manage_workspace(uuid) from public;
revoke all on function app_private.is_workspace_owner_record(uuid) from public;
revoke all on function app_private.can_view_profile(uuid) from public;
revoke all on function app_private.is_workspace_member_from_text(text) from public;

grant execute on function app_private.is_workspace_member(uuid) to authenticated;
grant execute on function app_private.can_manage_workspace(uuid) to authenticated;
grant execute on function app_private.is_workspace_owner_record(uuid) to authenticated;
grant execute on function app_private.can_view_profile(uuid) to authenticated;
grant execute on function app_private.is_workspace_member_from_text(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.telegram_bots enable row level security;
alter table public.telegram_chats enable row level security;
alter table public.telegram_events enable row level security;
alter table public.payments enable row level security;
alter table public.pix_charges enable row level security;
alter table public.payment_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.webhook_inbox enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.workspaces from anon, authenticated;
revoke all on public.workspace_members from anon, authenticated;
revoke all on public.telegram_bots from anon, authenticated;
revoke all on public.telegram_chats from anon, authenticated;
revoke all on public.telegram_events from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.pix_charges from anon, authenticated;
revoke all on public.payment_events from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
revoke all on public.webhook_inbox from anon, authenticated;

grant select on public.profiles to authenticated;
grant insert (id, email, name, avatar_url, default_workspace_id) on public.profiles to authenticated;
grant update (name, avatar_url, default_workspace_id) on public.profiles to authenticated;

grant select on public.workspaces to authenticated;
grant insert (owner_id, name, slug) on public.workspaces to authenticated;
grant update (name, slug) on public.workspaces to authenticated;

grant select on public.workspace_members to authenticated;
grant insert (workspace_id, user_id, role, status) on public.workspace_members to authenticated;
grant update (role, status) on public.workspace_members to authenticated;
grant delete on public.workspace_members to authenticated;

grant select (
  id,
  workspace_id,
  bot_username,
  bot_name,
  telegram_bot_external_id,
  webhook_status,
  status,
  last_verified_at,
  created_at,
  updated_at
) on public.telegram_bots to authenticated;

grant select on public.telegram_chats to authenticated;
grant select (
  id,
  workspace_id,
  telegram_bot_id,
  telegram_chat_id,
  update_id,
  event_type,
  processing_status,
  processed_at,
  error_message,
  created_at
) on public.telegram_events to authenticated;

grant select on public.payments to authenticated;
grant select on public.pix_charges to authenticated;
grant select (
  id,
  workspace_id,
  payment_id,
  provider,
  provider_event_id,
  event_type,
  processing_status,
  processed_at,
  error_message,
  created_at
) on public.payment_events to authenticated;

grant select on public.audit_logs to authenticated;
grant select (
  id,
  workspace_id,
  source,
  external_id,
  event_type,
  processing_status,
  processed_at,
  error_message,
  created_at
) on public.webhook_inbox to authenticated;

create policy profiles_select_visible
on public.profiles
for select
to authenticated
using (app_private.can_view_profile(id));

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy workspaces_select_member
on public.workspaces
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or app_private.is_workspace_member(id)
);

create policy workspaces_insert_owner
on public.workspaces
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy workspaces_update_managers
on public.workspaces
for update
to authenticated
using (app_private.can_manage_workspace(id))
with check (app_private.can_manage_workspace(id));

create policy workspace_members_select_same_workspace
on public.workspace_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or app_private.is_workspace_member(workspace_id)
);

create policy workspace_members_insert_owner_or_manager
on public.workspace_members
for insert
to authenticated
with check (
  app_private.can_manage_workspace(workspace_id)
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and app_private.is_workspace_owner_record(workspace_id)
  )
);

create policy workspace_members_update_managers
on public.workspace_members
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy workspace_members_delete_managers
on public.workspace_members
for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

create policy telegram_bots_select_member
on public.telegram_bots
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy telegram_chats_select_member
on public.telegram_chats
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy telegram_events_select_member
on public.telegram_events
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy payments_select_member
on public.payments
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy pix_charges_select_member
on public.pix_charges
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy payment_events_select_member
on public.payment_events
for select
to authenticated
using (
  workspace_id is not null
  and app_private.is_workspace_member(workspace_id)
);

create policy audit_logs_select_member
on public.audit_logs
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy webhook_inbox_select_member
on public.webhook_inbox
for select
to authenticated
using (
  workspace_id is not null
  and app_private.is_workspace_member(workspace_id)
);

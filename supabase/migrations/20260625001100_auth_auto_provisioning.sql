create schema if not exists app_private;

create or replace function app_private.provision_user_account(
  target_user_id uuid,
  target_email text,
  target_user_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  profile_name text;
  profile_email text;
  workspace_name text;
  workspace_slug text;
  workspace_id uuid;
begin
  profile_email := coalesce(nullif(trim(target_email), ''), target_user_id::text || '@auth.local');
  profile_name := nullif(
    trim(
      coalesce(
        target_user_metadata ->> 'name',
        target_user_metadata ->> 'full_name',
        split_part(profile_email, '@', 1)
      )
    ),
    ''
  );

  insert into public.profiles (id, email, name, avatar_url)
  values (
    target_user_id,
    profile_email,
    profile_name,
    nullif(trim(coalesce(target_user_metadata ->> 'avatar_url', '')), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  select default_workspace_id
  into workspace_id
  from public.profiles
  where id = target_user_id;

  if workspace_id is null then
    select wm.workspace_id
    into workspace_id
    from public.workspace_members wm
    where wm.user_id = target_user_id
      and wm.role = 'owner'
      and wm.status = 'active'
    order by wm.created_at asc
    limit 1;
  end if;

  if workspace_id is null then
    workspace_name := 'Workspace de ' || coalesce(profile_name, split_part(profile_email, '@', 1), 'usuario');
    workspace_slug := lower(
      regexp_replace(
        regexp_replace(
          coalesce(profile_name, split_part(profile_email, '@', 1), 'workspace'),
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        ),
        '(^-|-$)',
        '',
        'g'
      )
    );
    workspace_slug := coalesce(nullif(left(workspace_slug, 40), ''), 'workspace')
      || '-'
      || substr(replace(target_user_id::text, '-', ''), 1, 8);

    insert into public.workspaces (owner_id, name, slug)
    values (target_user_id, workspace_name, workspace_slug)
    returning id into workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role, status)
    values (workspace_id, target_user_id, 'owner', 'active')
    on conflict (workspace_id, user_id) do update
    set role = 'owner',
        status = 'active';
  end if;

  update public.profiles
  set default_workspace_id = workspace_id
  where id = target_user_id
    and default_workspace_id is null;

  return workspace_id;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  begin
    perform app_private.provision_user_account(
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data, '{}'::jsonb)
    );
  exception
    when others then
      raise warning 'auth user provisioning failed for user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

do $$
declare
  auth_user record;
begin
  for auth_user in
    select id, email, raw_user_meta_data
    from auth.users
  loop
    begin
      perform app_private.provision_user_account(
        auth_user.id,
        auth_user.email,
        coalesce(auth_user.raw_user_meta_data, '{}'::jsonb)
      );
    exception
      when others then
        raise warning 'auth user backfill provisioning failed for user %: %', auth_user.id, sqlerrm;
    end;
  end loop;
end;
$$;

revoke all on function app_private.provision_user_account(uuid, text, jsonb) from public;
revoke all on function app_private.provision_user_account(uuid, text, jsonb) from anon;
revoke all on function app_private.provision_user_account(uuid, text, jsonb) from authenticated;
revoke all on function public.handle_auth_user_created() from public;
revoke all on function public.handle_auth_user_created() from anon;
revoke all on function public.handle_auth_user_created() from authenticated;

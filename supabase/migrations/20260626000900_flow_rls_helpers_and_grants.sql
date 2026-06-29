create or replace function app_private.can_edit_workspace_content(target_workspace_id uuid)
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
        and wm.role in ('owner', 'admin', 'member')
    ),
    false
  );
$$;

create or replace function app_private.can_edit_flow_version(
  target_flow_version_id uuid,
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    target_flow_version_id is not null
    and app_private.can_edit_workspace_content(target_workspace_id)
    and exists (
      select 1
      from public.flow_versions fv
      where fv.id = target_flow_version_id
        and fv.workspace_id = target_workspace_id
        and fv.status = 'draft'
    ),
    false
  );
$$;

revoke all on function app_private.can_edit_workspace_content(uuid) from public;
revoke all on function app_private.can_edit_flow_version(uuid, uuid) from public;

grant execute on function app_private.can_edit_workspace_content(uuid) to authenticated;
grant execute on function app_private.can_edit_flow_version(uuid, uuid) to authenticated;

alter table public.flows enable row level security;
alter table public.flow_versions enable row level security;
alter table public.flow_version_nodes enable row level security;
alter table public.flow_version_edges enable row level security;
alter table public.flow_bot_bindings enable row level security;
alter table public.flow_deployments enable row level security;
alter table public.flow_deployment_variants enable row level security;
alter table public.flow_sessions enable row level security;
alter table public.flow_run_steps enable row level security;
alter table public.flow_events enable row level security;
alter table public.flow_experiments enable row level security;
alter table public.workspace_integrations enable row level security;
alter table public.flow_ai_profiles enable row level security;

revoke all on public.flows from anon, authenticated;
revoke all on public.flow_versions from anon, authenticated;
revoke all on public.flow_version_nodes from anon, authenticated;
revoke all on public.flow_version_edges from anon, authenticated;
revoke all on public.flow_bot_bindings from anon, authenticated;
revoke all on public.flow_deployments from anon, authenticated;
revoke all on public.flow_deployment_variants from anon, authenticated;
revoke all on public.flow_sessions from anon, authenticated;
revoke all on public.flow_run_steps from anon, authenticated;
revoke all on public.flow_events from anon, authenticated;
revoke all on public.flow_experiments from anon, authenticated;
revoke all on public.workspace_integrations from anon, authenticated;
revoke all on public.flow_ai_profiles from anon, authenticated;

grant select, insert, update on public.flows to authenticated;
grant select, insert, update on public.flow_versions to authenticated;
grant select, insert, update, delete on public.flow_version_nodes to authenticated;
grant select, insert, update, delete on public.flow_version_edges to authenticated;
grant select, insert, update on public.flow_bot_bindings to authenticated;
grant select, insert, update on public.flow_deployments to authenticated;
grant select, insert, update, delete on public.flow_deployment_variants to authenticated;
grant select on public.flow_sessions to authenticated;
grant select on public.flow_run_steps to authenticated;
grant select on public.flow_events to authenticated;
grant select, insert, update on public.flow_experiments to authenticated;

grant select (
  id,
  workspace_id,
  provider,
  name,
  status,
  config,
  created_by,
  created_at,
  updated_at
) on public.workspace_integrations to authenticated;
grant insert, update on public.workspace_integrations to authenticated;

grant select, insert, update on public.flow_ai_profiles to authenticated;

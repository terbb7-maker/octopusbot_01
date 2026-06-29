create policy flows_select_member
on public.flows
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flows_insert_editor
on public.flows
for insert
to authenticated
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flows_update_editor
on public.flows
for update
to authenticated
using (app_private.can_edit_workspace_content(workspace_id))
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_versions_select_member
on public.flow_versions
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_versions_insert_editor
on public.flow_versions
for insert
to authenticated
with check (app_private.can_edit_workspace_content(workspace_id));

create policy flow_versions_update_draft_editor
on public.flow_versions
for update
to authenticated
using (
  status = 'draft'
  and app_private.can_edit_workspace_content(workspace_id)
)
with check (
  status = 'draft'
  and app_private.can_edit_workspace_content(workspace_id)
);

create policy flow_versions_update_manager
on public.flow_versions
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_version_nodes_select_member
on public.flow_version_nodes
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_version_nodes_insert_draft_editor
on public.flow_version_nodes
for insert
to authenticated
with check (app_private.can_edit_flow_version(flow_version_id, workspace_id));

create policy flow_version_nodes_update_draft_editor
on public.flow_version_nodes
for update
to authenticated
using (app_private.can_edit_flow_version(flow_version_id, workspace_id))
with check (app_private.can_edit_flow_version(flow_version_id, workspace_id));

create policy flow_version_nodes_delete_draft_editor
on public.flow_version_nodes
for delete
to authenticated
using (app_private.can_edit_flow_version(flow_version_id, workspace_id));

create policy flow_version_edges_select_member
on public.flow_version_edges
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_version_edges_insert_draft_editor
on public.flow_version_edges
for insert
to authenticated
with check (app_private.can_edit_flow_version(flow_version_id, workspace_id));

create policy flow_version_edges_update_draft_editor
on public.flow_version_edges
for update
to authenticated
using (app_private.can_edit_flow_version(flow_version_id, workspace_id))
with check (app_private.can_edit_flow_version(flow_version_id, workspace_id));

create policy flow_version_edges_delete_draft_editor
on public.flow_version_edges
for delete
to authenticated
using (app_private.can_edit_flow_version(flow_version_id, workspace_id));

create policy flow_bot_bindings_select_member
on public.flow_bot_bindings
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_bot_bindings_insert_manager
on public.flow_bot_bindings
for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_bot_bindings_update_manager
on public.flow_bot_bindings
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_deployments_select_member
on public.flow_deployments
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_deployments_insert_manager
on public.flow_deployments
for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_deployments_update_manager
on public.flow_deployments
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_deployment_variants_select_member
on public.flow_deployment_variants
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_deployment_variants_insert_manager
on public.flow_deployment_variants
for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_deployment_variants_update_manager
on public.flow_deployment_variants
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_deployment_variants_delete_manager
on public.flow_deployment_variants
for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

create policy flow_sessions_select_member
on public.flow_sessions
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_run_steps_select_member
on public.flow_run_steps
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_events_select_member
on public.flow_events
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_experiments_select_member
on public.flow_experiments
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_experiments_insert_manager
on public.flow_experiments
for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_experiments_update_manager
on public.flow_experiments
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy workspace_integrations_select_member
on public.workspace_integrations
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy workspace_integrations_insert_manager
on public.workspace_integrations
for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

create policy workspace_integrations_update_manager
on public.workspace_integrations
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_ai_profiles_select_member
on public.flow_ai_profiles
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy flow_ai_profiles_insert_manager
on public.flow_ai_profiles
for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

create policy flow_ai_profiles_update_manager
on public.flow_ai_profiles
for update
to authenticated
using (app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

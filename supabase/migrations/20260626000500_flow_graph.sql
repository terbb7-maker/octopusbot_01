create table public.flow_version_nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_version_id uuid not null,
  node_key text not null,
  node_type text not null,
  label text,
  config jsonb not null default '{}'::jsonb,
  position jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint flow_version_nodes_version_workspace_fkey
    foreign key (flow_version_id, workspace_id)
    references public.flow_versions (id, workspace_id)
    on delete cascade,
  constraint flow_version_nodes_key_not_blank check (length(trim(node_key)) > 0),
  constraint flow_version_nodes_type_not_blank check (length(trim(node_type)) > 0),
  constraint flow_version_nodes_label_not_blank check (label is null or length(trim(label)) > 0),
  constraint flow_version_nodes_config_object check (jsonb_typeof(config) = 'object'),
  constraint flow_version_nodes_position_object check (jsonb_typeof(position) = 'object')
);

alter table public.flow_version_nodes
  add constraint flow_version_nodes_id_workspace_unique unique (id, workspace_id),
  add constraint flow_version_nodes_version_key_workspace_unique unique (
    flow_version_id,
    node_key,
    workspace_id
  );

create table public.flow_version_edges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_version_id uuid not null,
  edge_key text not null,
  source_node_key text not null,
  target_node_key text not null,
  condition jsonb not null default '{}'::jsonb,
  priority integer not null default 0,
  created_at timestamptz not null default now(),

  constraint flow_version_edges_version_workspace_fkey
    foreign key (flow_version_id, workspace_id)
    references public.flow_versions (id, workspace_id)
    on delete cascade,
  constraint flow_version_edges_source_node_workspace_fkey
    foreign key (flow_version_id, source_node_key, workspace_id)
    references public.flow_version_nodes (flow_version_id, node_key, workspace_id)
    on delete cascade,
  constraint flow_version_edges_target_node_workspace_fkey
    foreign key (flow_version_id, target_node_key, workspace_id)
    references public.flow_version_nodes (flow_version_id, node_key, workspace_id)
    on delete cascade,
  constraint flow_version_edges_key_not_blank check (length(trim(edge_key)) > 0),
  constraint flow_version_edges_source_not_blank check (length(trim(source_node_key)) > 0),
  constraint flow_version_edges_target_not_blank check (length(trim(target_node_key)) > 0),
  constraint flow_version_edges_no_self_loop check (source_node_key <> target_node_key),
  constraint flow_version_edges_condition_object check (jsonb_typeof(condition) = 'object')
);

alter table public.flow_version_edges
  add constraint flow_version_edges_id_workspace_unique unique (id, workspace_id),
  add constraint flow_version_edges_version_key_workspace_unique unique (
    flow_version_id,
    edge_key,
    workspace_id
  );

create index flow_version_nodes_workspace_id_idx on public.flow_version_nodes (workspace_id);
create index flow_version_nodes_version_id_idx on public.flow_version_nodes (flow_version_id);
create index flow_version_nodes_type_idx on public.flow_version_nodes (node_type);
create index flow_version_nodes_created_at_idx on public.flow_version_nodes (created_at);

create index flow_version_edges_workspace_id_idx on public.flow_version_edges (workspace_id);
create index flow_version_edges_version_id_idx on public.flow_version_edges (flow_version_id);
create index flow_version_edges_source_idx on public.flow_version_edges (flow_version_id, source_node_key);
create index flow_version_edges_target_idx on public.flow_version_edges (flow_version_id, target_node_key);
create index flow_version_edges_priority_idx on public.flow_version_edges (flow_version_id, priority);

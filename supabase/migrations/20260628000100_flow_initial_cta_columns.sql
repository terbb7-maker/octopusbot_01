alter table public.flow_versions
  add column if not exists cta_enabled boolean not null default false,
  add column if not exists cta_label text,
  add column if not exists cta_action text not null default 'show_plans',
  add column if not exists cta_url text,
  add column if not exists cta_message text;

alter table public.flow_versions
  add constraint flow_versions_cta_action_check
  check (cta_action in ('show_plans', 'open_link', 'send_message'));

create index if not exists flow_versions_cta_enabled_idx
  on public.flow_versions (workspace_id, cta_enabled);

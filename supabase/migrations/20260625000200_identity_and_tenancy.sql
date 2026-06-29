create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  default_workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null,
  status public.workspace_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workspaces_name_not_blank check (length(trim(name)) > 0),
  constraint workspaces_slug_not_blank check (length(trim(slug)) > 0)
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_member_role not null default 'member',
  status public.workspace_member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_default_workspace_id_fkey
  foreign key (default_workspace_id)
  references public.workspaces (id)
  on delete set null;

create unique index profiles_email_unique_idx on public.profiles (lower(email));
create index profiles_default_workspace_id_idx on public.profiles (default_workspace_id);

create unique index workspaces_slug_unique_idx on public.workspaces (lower(slug));
create index workspaces_owner_id_idx on public.workspaces (owner_id);
create index workspaces_status_idx on public.workspaces (status);

create unique index workspace_members_workspace_user_unique_idx on public.workspace_members (workspace_id, user_id);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_status_idx on public.workspace_members (status);
create index workspace_members_role_idx on public.workspace_members (role);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

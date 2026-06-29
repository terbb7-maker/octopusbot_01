create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  method public.payment_method not null default 'pix',
  status public.payment_status not null default 'pending',
  amount_cents integer not null,
  currency text not null default 'BRL',
  approved_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payments_provider_not_blank check (length(trim(provider)) > 0),
  constraint payments_amount_positive check (amount_cents > 0),
  constraint payments_currency_brl check (currency = 'BRL'),
  constraint payments_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint payments_approved_at_required check (status <> 'approved' or approved_at is not null)
);

create table public.pix_charges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete cascade,
  provider text not null,
  provider_charge_id text,
  qr_code text not null,
  qr_code_base64 text,
  copy_paste text not null,
  status public.pix_charge_status not null default 'pending',
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pix_charges_provider_not_blank check (length(trim(provider)) > 0),
  constraint pix_charges_qr_code_not_blank check (length(trim(qr_code)) > 0),
  constraint pix_charges_copy_paste_not_blank check (length(trim(copy_paste)) > 0),
  constraint pix_charges_paid_at_required check (status <> 'paid' or paid_at is not null)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processing_status public.event_processing_status not null default 'received',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),

  constraint payment_events_provider_not_blank check (length(trim(provider)) > 0),
  constraint payment_events_provider_event_id_not_blank check (length(trim(provider_event_id)) > 0),
  constraint payment_events_event_type_not_blank check (length(trim(event_type)) > 0),
  constraint payment_events_payload_object check (jsonb_typeof(payload) = 'object')
);

create index payments_workspace_id_idx on public.payments (workspace_id);
create index payments_status_idx on public.payments (status);
create index payments_provider_payment_id_idx on public.payments (provider_payment_id);
create unique index payments_provider_payment_unique_idx
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create index payments_created_at_idx on public.payments (created_at);

create unique index pix_charges_payment_id_unique_idx on public.pix_charges (payment_id);
create index pix_charges_workspace_id_idx on public.pix_charges (workspace_id);
create index pix_charges_provider_charge_id_idx on public.pix_charges (provider_charge_id);
create index pix_charges_status_idx on public.pix_charges (status);
create index pix_charges_expires_at_idx on public.pix_charges (expires_at);

create unique index payment_events_provider_event_unique_idx on public.payment_events (provider, provider_event_id);
create index payment_events_workspace_id_idx on public.payment_events (workspace_id);
create index payment_events_payment_id_idx on public.payment_events (payment_id);
create index payment_events_processing_status_idx on public.payment_events (processing_status);
create index payment_events_created_at_idx on public.payment_events (created_at);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger pix_charges_set_updated_at
before update on public.pix_charges
for each row execute function public.set_updated_at();

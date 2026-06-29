create extension if not exists pgcrypto with schema extensions;

create type public.workspace_status as enum ('active', 'suspended', 'archived');
create type public.workspace_member_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.workspace_member_status as enum ('active', 'invited', 'removed');

create type public.telegram_webhook_status as enum ('pending', 'active', 'failed', 'disabled');
create type public.telegram_bot_status as enum ('active', 'disabled', 'revoked');
create type public.event_processing_status as enum ('received', 'processing', 'processed', 'ignored', 'failed');

create type public.payment_method as enum ('pix');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'expired', 'refunded', 'failed');
create type public.pix_charge_status as enum ('pending', 'paid', 'expired', 'cancelled', 'failed');

create type public.webhook_source as enum ('telegram', 'payment_provider');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

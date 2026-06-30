alter table public.payments
  drop constraint if exists payments_order_id_fkey;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'order_id'
  ) then
    alter table public.payments
      alter column order_id drop not null;

    comment on column public.payments.order_id is
      'Legacy column kept nullable for compatibility. Flow runtime payments use checkout_id and session_id.';
  end if;
end $$;

create unique index if not exists flow_bot_bindings_one_active_bot_idx
  on public.flow_bot_bindings (telegram_bot_id)
  where status = 'active' and deleted_at is null;

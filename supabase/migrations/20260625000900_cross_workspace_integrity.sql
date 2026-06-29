alter table public.telegram_bots
  add constraint telegram_bots_id_workspace_unique unique (id, workspace_id);

alter table public.telegram_chats
  add constraint telegram_chats_id_workspace_unique unique (id, workspace_id),
  add constraint telegram_chats_id_bot_workspace_unique unique (id, telegram_bot_id, workspace_id),
  add constraint telegram_chats_bot_workspace_fkey
    foreign key (telegram_bot_id, workspace_id)
    references public.telegram_bots (id, workspace_id)
    on delete cascade;

alter table public.telegram_events
  add constraint telegram_events_bot_workspace_fkey
    foreign key (telegram_bot_id, workspace_id)
    references public.telegram_bots (id, workspace_id)
    on delete cascade,
  add constraint telegram_events_chat_workspace_fkey
    foreign key (telegram_chat_id, workspace_id)
    references public.telegram_chats (id, workspace_id),
  add constraint telegram_events_chat_bot_workspace_fkey
    foreign key (telegram_chat_id, telegram_bot_id, workspace_id)
    references public.telegram_chats (id, telegram_bot_id, workspace_id);

alter table public.payments
  add constraint payments_id_workspace_unique unique (id, workspace_id),
  add constraint payments_id_provider_workspace_unique unique (id, provider, workspace_id);

alter table public.pix_charges
  add constraint pix_charges_payment_workspace_fkey
    foreign key (payment_id, workspace_id)
    references public.payments (id, workspace_id)
    on delete cascade,
  add constraint pix_charges_payment_provider_workspace_fkey
    foreign key (payment_id, provider, workspace_id)
    references public.payments (id, provider, workspace_id)
    on delete cascade;

alter table public.payment_events
  add constraint payment_events_payment_workspace_fkey
    foreign key (payment_id, workspace_id)
    references public.payments (id, workspace_id),
  add constraint payment_events_payment_provider_workspace_fkey
    foreign key (payment_id, provider, workspace_id)
    references public.payments (id, provider, workspace_id);

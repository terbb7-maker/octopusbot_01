alter table public.telegram_chats
  add column if not exists chat_type text,
  add column if not exists title text;

alter table public.telegram_chats
  add constraint telegram_chats_chat_type_check
  check (
    chat_type is null
    or chat_type in ('private', 'group', 'supergroup', 'channel')
  );

create index if not exists telegram_chats_chat_type_idx
  on public.telegram_chats (chat_type);

create index if not exists telegram_chats_title_idx
  on public.telegram_chats (lower(title));

alter table public.telegram_chats
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists state text;

create index if not exists telegram_chats_email_idx
  on public.telegram_chats (lower(email))
  where email is not null;

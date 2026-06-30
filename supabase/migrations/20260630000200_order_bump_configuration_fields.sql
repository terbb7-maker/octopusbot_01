alter table public.flow_versions
  add column if not exists order_bump_accept_button_text text,
  add column if not exists order_bump_accept_button_color text not null default 'auto',
  add column if not exists order_bump_decline_button_text text,
  add column if not exists order_bump_decline_button_color text not null default 'auto',
  add column if not exists order_bump_media_type text,
  add column if not exists order_bump_media_group boolean not null default false,
  add column if not exists order_bump_delivery_type text,
  add column if not exists order_bump_delivery_chat_id bigint,
  add column if not exists order_bump_delivery_url text,
  add column if not exists order_bump_delivery_message text;

alter table public.flow_versions
  drop constraint if exists flow_versions_order_bump_accept_button_color_check,
  add constraint flow_versions_order_bump_accept_button_color_check
    check (order_bump_accept_button_color in ('auto', 'blue', 'green', 'red'));

alter table public.flow_versions
  drop constraint if exists flow_versions_order_bump_decline_button_color_check,
  add constraint flow_versions_order_bump_decline_button_color_check
    check (order_bump_decline_button_color in ('auto', 'blue', 'green', 'red'));

alter table public.flow_versions
  drop constraint if exists flow_versions_order_bump_media_type_check,
  add constraint flow_versions_order_bump_media_type_check
    check (
      order_bump_media_type is null
      or order_bump_media_type in ('image', 'video', 'audio')
    );

alter table public.flow_versions
  drop constraint if exists flow_versions_order_bump_delivery_type_check,
  add constraint flow_versions_order_bump_delivery_type_check
    check (
      order_bump_delivery_type is null
      or order_bump_delivery_type in (
        'default',
        'telegram_group',
        'telegram_channel',
        'link',
        'custom_message'
      )
    );

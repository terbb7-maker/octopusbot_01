alter table if exists public.flow_upsell_sequences
  drop column if exists delivery_type,
  drop column if exists delivery_chat_id,
  drop column if exists delivery_url,
  drop column if exists delivery_message;

drop type if exists public.flow_offer_delivery_type;

alter table if exists public.flow_upsell_sequences
  alter column delay_unit drop default,
  alter column accept_button_color drop default,
  alter column decline_button_color drop default,
  alter column order_bump_mode drop default;

alter table if exists public.flow_upsell_sequences
  alter column delay_unit type text using delay_unit::text,
  alter column accept_button_color type text using accept_button_color::text,
  alter column decline_button_color type text using decline_button_color::text,
  alter column order_bump_mode type text using order_bump_mode::text;

alter table if exists public.flow_upsell_sequences
  alter column delay_unit set default 'minutes',
  alter column accept_button_color set default 'auto',
  alter column decline_button_color set default 'auto',
  alter column order_bump_mode set default 'none';

alter table if exists public.flow_upsell_sequences
  drop constraint if exists flow_upsell_sequences_delay_unit_check,
  drop constraint if exists flow_upsell_sequences_accept_color_check,
  drop constraint if exists flow_upsell_sequences_decline_color_check,
  drop constraint if exists flow_upsell_sequences_order_bump_mode_check;

alter table if exists public.flow_upsell_sequences
  add constraint flow_upsell_sequences_delay_unit_check
    check (delay_unit in ('seconds', 'minutes')),
  add constraint flow_upsell_sequences_accept_color_check
    check (accept_button_color in ('auto', 'blue', 'green', 'red')),
  add constraint flow_upsell_sequences_decline_color_check
    check (decline_button_color in ('auto', 'blue', 'green', 'red')),
  add constraint flow_upsell_sequences_order_bump_mode_check
    check (order_bump_mode in ('none', 'global', 'exclusive'));

drop type if exists public.flow_offer_delay_unit;
drop type if exists public.flow_offer_button_color;
drop type if exists public.flow_offer_order_bump_mode;

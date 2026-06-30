alter table if exists public.flow_upsell_sequences
  drop column if exists delivery_type,
  drop column if exists delivery_chat_id,
  drop column if exists delivery_url,
  drop column if exists delivery_message;

drop type if exists public.flow_offer_delivery_type;

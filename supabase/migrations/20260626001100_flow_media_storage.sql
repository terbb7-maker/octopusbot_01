insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flow-media',
  'flow-media',
  false,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/webm',
    'audio/wav'
  ]
)
on conflict (id) do nothing;

create or replace function app_private.can_edit_workspace_content_from_text(
  target_workspace_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  parsed_workspace_id uuid;
begin
  if target_workspace_id is null or length(trim(target_workspace_id)) = 0 then
    return false;
  end if;

  begin
    parsed_workspace_id := target_workspace_id::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;

  return app_private.can_edit_workspace_content(parsed_workspace_id);
end;
$$;

revoke all on function app_private.can_edit_workspace_content_from_text(text) from public;
grant execute on function app_private.can_edit_workspace_content_from_text(text) to authenticated;

create policy flow_media_storage_select_member
on storage.objects
for select
to authenticated
using (
  bucket_id = 'flow-media'
  and app_private.is_workspace_member_from_text((storage.foldername(name))[1])
);

create policy flow_media_storage_insert_member
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'flow-media'
  and app_private.can_edit_workspace_content_from_text((storage.foldername(name))[1])
);

create policy flow_media_storage_update_member
on storage.objects
for update
to authenticated
using (
  bucket_id = 'flow-media'
  and app_private.can_edit_workspace_content_from_text((storage.foldername(name))[1])
)
with check (
  bucket_id = 'flow-media'
  and app_private.can_edit_workspace_content_from_text((storage.foldername(name))[1])
);

create policy flow_media_storage_delete_member
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'flow-media'
  and app_private.can_edit_workspace_content_from_text((storage.foldername(name))[1])
);

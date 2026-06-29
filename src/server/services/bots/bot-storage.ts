import type { TelegramBotProfile } from "@/server/adapters/telegram/types";
import type { SupabaseServer } from "@/server/services/bots/bot-context";

export async function signedAvatarUrl(
  supabase: SupabaseServer,
  path: string | null,
) {
  if (!path) {
    return null;
  }

  const { data } = await supabase.storage
    .from("telegram-bot-avatars")
    .createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}

export async function uploadAvatar(
  supabase: SupabaseServer,
  workspaceId: string,
  profile: TelegramBotProfile,
) {
  if (!profile.avatarBytes || !profile.avatarContentType) {
    return null;
  }

  const extension = profile.avatarContentType.includes("png") ? "png" : "jpg";
  const path = `${workspaceId}/${profile.id}.${extension}`;
  const { error } = await supabase.storage
    .from("telegram-bot-avatars")
    .upload(path, profile.avatarBytes, {
      contentType: profile.avatarContentType,
      upsert: true,
    });

  return error ? null : path;
}

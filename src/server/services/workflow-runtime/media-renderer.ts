import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  sendTelegramMedia,
  sendTelegramMediaGroup,
} from "@/server/adapters/telegram/telegram-adapter";
import type {
  FlowInitialConfigMedia,
  FlowMessageMedia,
} from "@/server/services/flows";

const FLOW_MEDIA_BUCKET = "flow-media";

type MediaRendererInput = {
  chatId: number;
  token: string;
};

async function signedMediaUrl(path?: string | null) {
  if (!path) return null;

  const admin = getSupabaseServiceRoleClient();
  const { data } = await admin.storage
    .from(FLOW_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}

export class MediaRenderer {
  async sendInitialMedia(
    input: MediaRendererInput & { media?: FlowInitialConfigMedia },
  ) {
    const media = input.media ?? {};
    const images = media.images?.length
      ? media.images
      : media.image
        ? [media.image]
        : [];

    if (media.type === "image" && images.length) {
      const urls = (
        await Promise.all(images.map((item) => signedMediaUrl(item.path)))
      ).filter((url): url is string => Boolean(url));

      if (media.groupImages && urls.length > 1) {
        await sendTelegramMediaGroup({
          chatId: input.chatId,
          mediaUrls: urls,
          token: input.token,
        });
        return;
      }

      for (const url of urls) {
        await sendTelegramMedia({
          chatId: input.chatId,
          mediaUrl: url,
          token: input.token,
          type: "image",
        });
      }
      return;
    }

    for (const type of ["video", "audio"] as const) {
      const item = media[type];
      const url = await signedMediaUrl(item?.path);

      if (!url) continue;

      await sendTelegramMedia({
        chatId: input.chatId,
        mediaUrl: url,
        token: input.token,
        type,
      });
    }
  }

  async sendMessageMedia(input: MediaRendererInput & { media: FlowMessageMedia[] }) {
    for (const item of input.media) {
      const url = await signedMediaUrl(item.path);
      if (!url) continue;

      const type = item.type.startsWith("video")
        ? "video"
        : item.type.startsWith("audio")
          ? "audio"
          : "image";

      await sendTelegramMedia({
        chatId: input.chatId,
        mediaUrl: url,
        token: input.token,
        type,
      });
    }
  }
}

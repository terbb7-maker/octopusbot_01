"use client";

import Image from "next/image";

type MediaLike = {
  name: string;
  signedUrl?: string | null;
  type: string;
};

export function MediaRenderer({ media }: { media: MediaLike }) {
  if (media.signedUrl && media.type.startsWith("image/")) {
    return (
      <Image
        src={media.signedUrl}
        alt={media.name}
        width={360}
        height={220}
        unoptimized
        className="mb-2 max-h-40 w-full rounded-lg object-cover"
      />
    );
  }

  if (media.signedUrl && media.type.startsWith("video/")) {
    return <video src={media.signedUrl} controls className="mb-2 w-full rounded-lg" />;
  }

  if (media.signedUrl && media.type.startsWith("audio/")) {
    return <audio src={media.signedUrl} controls className="mb-2 w-full" />;
  }

  return (
    <div className="mb-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
      {media.name}
    </div>
  );
}

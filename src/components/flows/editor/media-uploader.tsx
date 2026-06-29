"use client";

import { useRef, useState } from "react";
import { FileAudio, FileImage, FileVideo, UploadCloud } from "lucide-react";

import { MediaRenderer } from "@/components/flows/editor/media-renderer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadInitialConfigMediaAction } from "@/server/actions/flows";
import type {
  FlowInitialConfig,
  FlowInitialConfigMediaKind,
  FlowInitialConfigMediaValue,
} from "@/server/services/flows";
import { cn } from "@/lib/utils";

type MediaUploaderProps = {
  config: FlowInitialConfig;
  flowId: string;
  onChange: (config: FlowInitialConfig) => void;
};

const limits = {
  audio: {
    accept: ".mp3,.ogg,.wav,.m4a,audio/mpeg,audio/ogg,audio/wav,audio/mp4",
    copy: "Clique ou arraste um audio",
    formats: "MP3, OGG, WAV, M4A",
    icon: FileAudio,
    multiple: false,
  },
  image: {
    accept: ".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp",
    copy: "Clique ou arraste ate 5 imagens",
    formats: "JPG, PNG, GIF, WEBP",
    icon: FileImage,
    multiple: true,
  },
  video: {
    accept: ".mp4,.avi,.mov,.webm,video/mp4,video/x-msvideo,video/quicktime,video/webm",
    copy: "Clique ou arraste um video",
    formats: "MP4, AVI, MOV, WEBM",
    icon: FileVideo,
    multiple: false,
  },
} satisfies Record<FlowInitialConfigMediaKind, {
  accept: string;
  copy: string;
  formats: string;
  icon: typeof FileImage;
  multiple: boolean;
}>;

function orderedMedia(media: FlowInitialConfig["media"]) {
  if (!media) return [];

  if (media.type === "video") return media.video ? [media.video] : [];
  if (media.type === "audio") return media.audio ? [media.audio] : [];

  return media.images?.length
    ? media.images
    : media.image
      ? [media.image]
      : [];
}

export function MediaUploader({ config, flowId, onChange }: MediaUploaderProps) {
  const mediaType = config.media?.type ?? "image";
  const current = limits[mediaType];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const Icon = current.icon;

  async function uploadFiles(files: FileList | File[]) {
    const selected = Array.from(files);

    if (!selected.length) return;

    setStatus("Enviando midia...");
    const formData = new FormData();
    formData.set("flowId", flowId);
    formData.set("kind", mediaType);
    selected.slice(0, mediaType === "image" ? 5 : 1).forEach((file) => {
      formData.append("files", file);
    });

    const result = await uploadInitialConfigMediaAction(formData);

    if (!result.ok || !("media" in result) || !Array.isArray(result.media)) {
      setStatus(result.message);
      return;
    }

    const media = result.media.map((item, index) => ({
      ...(item as FlowInitialConfigMediaValue),
      order: index,
      url: (item as FlowInitialConfigMediaValue).url ?? item.path,
    }));
    const nextMedia = {
      ...(config.media ?? {}),
      type: mediaType,
      groupImages: config.media?.groupImages ?? false,
      images: mediaType === "image" ? media : [],
      video: mediaType === "video" ? media[0] ?? null : null,
      audio: mediaType === "audio" ? media[0] ?? null : null,
    };

    onChange({ ...config, media: nextMedia });
    setStatus("Midia pronta para salvar.");
  }

  function changeType(type: FlowInitialConfigMediaKind) {
    onChange({
      ...config,
      media: {
        ...(config.media ?? {}),
        type,
        groupImages: type === "image" ? config.media?.groupImages ?? false : false,
      },
    });
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="media-type">Tipo da midia</Label>
        <select
          id="media-type"
          value={mediaType}
          onChange={(event) =>
            changeType(event.target.value as FlowInitialConfigMediaKind)
          }
          className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
        >
          <option value="image">Imagem</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          uploadFiles(event.dataTransfer.files);
        }}
        className={cn(
          "grid min-h-44 place-items-center rounded-lg border border-dashed border-white/15 bg-black/20 p-6 text-center transition-colors",
          dragging && "border-primary/70 bg-primary/10",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={current.accept}
          multiple={current.multiple}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-md bg-primary/15 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">
            {current.copy}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {current.formats} - Maximo 10MB por arquivo
          </p>
          <UploadCloud className="mx-auto mt-3 size-4 text-muted-foreground" />
        </div>
      </button>

      {mediaType === "image" ? (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={Boolean(config.media?.groupImages)}
            onChange={(event) =>
              onChange({
                ...config,
                media: {
                  ...(config.media ?? {}),
                  type: "image",
                  groupImages: event.target.checked,
                },
              })
            }
          />
          Agrupar imagens
        </label>
      ) : null}

      <div className="grid gap-2">
        {orderedMedia(config.media).map((media) => (
          <MediaRenderer key={media.path} media={media} />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{status || "Uploads sao enviados ao Storage e salvos no fluxo ao clicar em Salvar tudo."}</span>
        {orderedMedia(config.media).length ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={() =>
              onChange({
                ...config,
                media: {
                  ...(config.media ?? {}),
                  images: [],
                  video: null,
                  audio: null,
                  image: undefined,
                },
              })
            }
          >
            Remover midia
          </Button>
        ) : null}
      </div>
    </section>
  );
}

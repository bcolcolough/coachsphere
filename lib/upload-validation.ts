import { z } from "zod";
import { envNumber } from "@/lib/env";

export const thumbnailMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const;
export const audioMimeTypes = ["audio/mp4", "audio/x-m4a", "audio/mpeg", "audio/aac", "audio/wav"] as const;
export const videoMimeTypes = ["video/mp4"] as const;

export type UploadKind = "THUMBNAIL" | "AUDIO" | "VIDEO";

const mimeTypesByKind: Record<UploadKind, readonly string[]> = {
  THUMBNAIL: thumbnailMimeTypes,
  AUDIO: audioMimeTypes,
  VIDEO: videoMimeTypes,
};

const defaultMaxMbByKind: Record<UploadKind, number> = {
  THUMBNAIL: 10,
  AUDIO: 500,
  VIDEO: 2048,
};

function maxMbForKind(kind: UploadKind) {
  if (kind === "THUMBNAIL") return envNumber("MAX_THUMBNAIL_MB", defaultMaxMbByKind.THUMBNAIL);
  if (kind === "AUDIO") return envNumber("MAX_AUDIO_MB", defaultMaxMbByKind.AUDIO);
  return envNumber("MAX_VIDEO_MB", defaultMaxMbByKind.VIDEO);
}

export function validateUpload({ kind, mimeType, sizeBytes }: { kind: UploadKind; mimeType: string; sizeBytes: number }) {
  const allowedMimeTypes = mimeTypesByKind[kind];
  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      ok: false as const,
      error: `${kind.toLowerCase()} uploads must use one of: ${allowedMimeTypes.join(", ")}`,
    };
  }

  const maxBytes = maxMbForKind(kind) * 1024 * 1024;
  if (sizeBytes <= 0) {
    return { ok: false as const, error: "Upload file is empty." };
  }
  if (sizeBytes > maxBytes) {
    return { ok: false as const, error: `${kind.toLowerCase()} upload exceeds ${maxMbForKind(kind)}MB.` };
  }

  return { ok: true as const };
}

export const chapterInputSchema = z.object({
  title: z.string().trim().min(1, "Chapter title is required."),
  startSeconds: z.coerce.number().int().min(0, "Chapter start time must be non-negative."),
});

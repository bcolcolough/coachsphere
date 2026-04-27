import { randomUUID } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? ".data/uploads");

const safeExtensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "video/mp4": "mp4",
};

export function createStorageKey(mimeType: string) {
  const extension = safeExtensionByMime[mimeType] ?? "bin";
  return `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
}

export function resolveStoragePath(storageKey: string) {
  const normalized = path.normalize(storageKey);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid storage key");
  }

  return path.join(uploadRoot, normalized);
}

export async function writeUpload(storageKey: string, bytes: Buffer) {
  const destination = resolveStoragePath(storageKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}

export async function getStorageSize(storageKey: string) {
  const fileStat = await stat(resolveStoragePath(storageKey));
  return fileStat.size;
}

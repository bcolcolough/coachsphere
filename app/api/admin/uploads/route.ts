import { NextResponse } from "next/server";
import { MediaKind } from "@prisma/client";
import { requireAdminSession } from "@/lib/session";
import { createStorageKey, writeUpload } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { validateUpload } from "@/lib/upload-validation";

export async function POST(request: Request) {
  await requireAdminSession();
  const form = await request.formData();
  const kind = form.get("kind");
  const file = form.get("file");

  if (!(file instanceof File) || typeof kind !== "string") {
    return NextResponse.json({ error: "Missing upload file or kind" }, { status: 400 });
  }

  const mediaKind = kind.toUpperCase() as MediaKind;
  if (!Object.values(MediaKind).includes(mediaKind)) {
    return NextResponse.json({ error: "Unsupported media kind" }, { status: 400 });
  }

  const validation = validateUpload({
    kind: mediaKind,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = createStorageKey(file.type);
  await writeUpload(storageKey, bytes);

  const asset = await prisma.mediaAsset.create({
    data: {
      kind: mediaKind,
      storageKey,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  return NextResponse.json({
    id: asset.id,
    kind: asset.kind,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
  });
}

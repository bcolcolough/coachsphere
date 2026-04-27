import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStoragePath } from "@/lib/media";
import { getCurrentSession } from "@/lib/session";

type MediaRouteProps = {
  params: Promise<{
    assetId: string;
  }>;
};

function parseRange(rangeHeader: string | null, fileSize: number) {
  if (!rangeHeader) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) {
    return null;
  }

  const start = match[1] ? Number.parseInt(match[1], 10) : 0;
  const end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, fileSize - 1),
  };
}

export async function GET(request: NextRequest, { params }: MediaRouteProps) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { assetId } = await params;
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    include: {
      episode: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (asset.episode?.status !== "PUBLISHED" && session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const storagePath = resolveStoragePath(asset.storageKey);
  const fileStat = await stat(storagePath).catch(() => null);

  if (!fileStat) {
    return new NextResponse("File not found", { status: 404 });
  }

  const range = parseRange(request.headers.get("range"), fileStat.size);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=300",
    "Content-Type": asset.mimeType,
    "X-Content-Type-Options": "nosniff",
  });

  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${fileStat.size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    return new NextResponse(
      createReadStream(storagePath, {
        start: range.start,
        end: range.end,
      }) as unknown as BodyInit,
      {
        status: 206,
        headers,
      },
    );
  }

  headers.set("Content-Length", String(fileStat.size));
  return new NextResponse(createReadStream(storagePath) as unknown as BodyInit, {
    headers,
  });
}

import { NextResponse } from "next/server";
import { EpisodeStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/session";
import { sendEpisodePublishedNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;

  const existing = await prisma.episode.findUnique({
    where: { id },
    include: { mediaAssets: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  if (!existing.mediaAssets.some((asset) => asset.kind === "AUDIO" || asset.kind === "VIDEO")) {
    return NextResponse.json(
      { error: "Add audio or video before publishing." },
      { status: 400 },
    );
  }

  const firstPublish = existing.status !== EpisodeStatus.PUBLISHED;
  const episode = await prisma.episode.update({
    where: { id },
    data: {
      status: EpisodeStatus.PUBLISHED,
      publishedAt: existing.publishedAt ?? new Date(),
    },
    include: { mediaAssets: true, chapters: true },
  });

  if (firstPublish) {
    await sendEpisodePublishedNotifications(episode);
  }

  return NextResponse.json({ episode });
}

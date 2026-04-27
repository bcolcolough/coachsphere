import { NextResponse } from "next/server";
import { EpisodeStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/session";
import { episodePayloadSchema, upsertEpisodeFromPayload } from "@/lib/episodes";
import { sendEpisodePublishedNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  const { id } = await context.params;
  const payload = episodePayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid episode payload" }, { status: 400 });
  }

  const existing = await prisma.episode.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const episode = await upsertEpisodeFromPayload({
    payload: payload.data,
    createdById: session.user.id,
    episodeId: id,
  });
  const firstPublish =
    existing.status !== EpisodeStatus.PUBLISHED &&
    episode.status === EpisodeStatus.PUBLISHED;

  if (firstPublish) {
    await sendEpisodePublishedNotifications(episode);
  }

  return NextResponse.json({ episode, firstPublish });
}

export async function DELETE(_request: Request, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;
  await prisma.episode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

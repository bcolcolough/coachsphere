import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

const progressSchema = z.object({
  episodeId: z.string().min(1),
  positionSeconds: z.number().int().min(0),
  completed: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload = progressSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid progress payload" }, { status: 400 });
  }

  const progress = await prisma.playbackProgress.upsert({
    where: {
      userId_episodeId: {
        userId: session.user.id,
        episodeId: payload.data.episodeId,
      },
    },
    update: {
      positionSeconds: payload.data.positionSeconds,
      completed: payload.data.completed,
    },
    create: {
      userId: session.user.id,
      episodeId: payload.data.episodeId,
      positionSeconds: payload.data.positionSeconds,
      completed: payload.data.completed,
    },
  });

  return NextResponse.json({
    positionSeconds: progress.positionSeconds,
    completed: progress.completed,
  });
}

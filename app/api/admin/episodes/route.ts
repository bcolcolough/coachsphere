import { NextResponse } from "next/server";
import { episodePayloadSchema, upsertEpisodeFromPayload } from "@/lib/episodes";
import { requireAdminSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  const payload = episodePayloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid episode payload" }, { status: 400 });
  }

  if (!payload.data.audioAssetId && !payload.data.videoAssetId) {
    return NextResponse.json(
      { error: "Episodes need at least one audio or video asset" },
      { status: 400 },
    );
  }

  const episode = await upsertEpisodeFromPayload({
    payload: payload.data,
    createdById: session.user.id,
  });

  return NextResponse.json({ id: episode.id, slug: episode.slug }, { status: 201 });
}

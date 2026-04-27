import { EpisodeStatus, MediaKind, type Prisma, type UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type EpisodeCardData = Prisma.EpisodeGetPayload<{
  include: {
    mediaAssets: true;
    playbackProgress: true;
    chapters: true;
  };
}>;

export type EpisodeListItem = EpisodeCardData;

export function slugifyTitle(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "episode"
  );
}

export async function ensureUniqueSlug(title: string, existingEpisodeId?: string) {
  const base = slugifyTitle(title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.episode.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === existingEpisodeId) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function listEpisodesForHome(userId: string) {
  return prisma.episode.findMany({
    where: {
      status: EpisodeStatus.PUBLISHED,
    },
    include: {
      mediaAssets: true,
      chapters: {
        orderBy: { startSeconds: "asc" },
      },
      playbackProgress: {
        where: { userId },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export const getPublishedEpisodesForUser = listEpisodesForHome;

export async function getEpisodeForPlayer(slug: string, userId: string, role: UserRole) {
  return prisma.episode.findFirst({
    where: {
      slug,
      ...(role === "ADMIN" ? {} : { status: EpisodeStatus.PUBLISHED }),
    },
    include: {
      mediaAssets: true,
      chapters: {
        orderBy: { startSeconds: "asc" },
      },
      playbackProgress: {
        where: { userId },
      },
    },
  });
}

export const getEpisodeBySlug = getEpisodeForPlayer;

export function getEpisodeAsset(episode: Pick<EpisodeCardData, "mediaAssets">, kind: MediaKind) {
  return episode.mediaAssets.find((asset) => asset.kind === kind) ?? null;
}

export function hasPlayableMedia(episode: Pick<EpisodeCardData, "mediaAssets">) {
  return Boolean(getEpisodeAsset(episode, MediaKind.VIDEO) ?? getEpisodeAsset(episode, MediaKind.AUDIO));
}

export const chapterPayloadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  startSeconds: z.number().int().min(0),
});

export const episodePayloadSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(240).optional().default(""),
  description: z.string().trim().min(1).max(1000),
  showNotes: z.string().trim().max(8000).optional().default(""),
  durationSeconds: z.number().int().min(0).optional().default(0),
  status: z.nativeEnum(EpisodeStatus).optional().default(EpisodeStatus.DRAFT),
  thumbnailAssetId: z.string().optional(),
  audioAssetId: z.string().optional(),
  videoAssetId: z.string().optional(),
  chapters: z.array(chapterPayloadSchema).optional().default([]),
});

export type EpisodePayload = z.infer<typeof episodePayloadSchema>;

async function validateAndAttachAssets(
  tx: Prisma.TransactionClient,
  episodeId: string,
  payload: Pick<EpisodePayload, "thumbnailAssetId" | "audioAssetId" | "videoAssetId">,
) {
  const assetIds = [
    payload.thumbnailAssetId,
    payload.audioAssetId,
    payload.videoAssetId,
  ].filter((assetId): assetId is string => Boolean(assetId));

  if (assetIds.length === 0) {
    return;
  }

  const mediaAssets = await tx.mediaAsset.findMany({
    where: { id: { in: assetIds } },
    select: { id: true, kind: true, episodeId: true },
  });
  if (mediaAssets.length !== assetIds.length) {
    throw new Error("One or more uploaded assets could not be found");
  }
  const kindsById = new Map(mediaAssets.map((asset) => [asset.id, asset.kind]));
  if (payload.thumbnailAssetId && kindsById.get(payload.thumbnailAssetId) !== MediaKind.THUMBNAIL) {
    throw new Error("Thumbnail asset has the wrong type");
  }
  if (payload.audioAssetId && kindsById.get(payload.audioAssetId) !== MediaKind.AUDIO) {
    throw new Error("Audio asset has the wrong type");
  }
  if (payload.videoAssetId && kindsById.get(payload.videoAssetId) !== MediaKind.VIDEO) {
    throw new Error("Video asset has the wrong type");
  }

  await tx.mediaAsset.updateMany({
    where: { episodeId },
    data: { episodeId: null },
  });
  await tx.mediaAsset.updateMany({
    where: { id: { in: assetIds } },
    data: { episodeId },
  });
}

export async function upsertEpisodeFromPayload({
  payload,
  createdById,
  episodeId,
}: {
  payload: EpisodePayload;
  createdById: string;
  episodeId?: string;
}) {
  if (!payload.audioAssetId && !payload.videoAssetId) {
    throw new Error("Episodes need at least one audio or video asset");
  }

  return prisma.$transaction(async (tx) => {
    const existingEpisode = episodeId
      ? await tx.episode.findUnique({
          where: { id: episodeId },
          select: { publishedAt: true },
        })
      : null;
    const publishedAt =
      payload.status === EpisodeStatus.PUBLISHED
        ? (existingEpisode?.publishedAt ?? new Date())
        : null;
    const chapterCreates = [...payload.chapters]
      .sort((a, b) => a.startSeconds - b.startSeconds)
      .map((chapter, index) => ({
        title: chapter.title,
        startSeconds: chapter.startSeconds,
        sortOrder: index,
      }));

    const episode = episodeId
      ? await tx.episode.update({
          where: { id: episodeId },
          data: {
            title: payload.title,
            subtitle: payload.subtitle || null,
            description: payload.description,
            showNotes: payload.showNotes || null,
            durationSeconds: payload.durationSeconds,
            status: payload.status,
            publishedAt,
            chapters: {
              deleteMany: {},
              create: chapterCreates,
            },
          },
        })
      : await tx.episode.create({
          data: {
            slug: await ensureUniqueSlug(payload.title),
            title: payload.title,
            subtitle: payload.subtitle || null,
            description: payload.description,
            showNotes: payload.showNotes || null,
            durationSeconds: payload.durationSeconds,
            status: payload.status,
            publishedAt,
            createdById,
            chapters: { create: chapterCreates },
          },
        });

    await validateAndAttachAssets(tx, episode.id, payload);
    return episode;
  });
}

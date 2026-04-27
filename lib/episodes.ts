import { EpisodeStatus, MediaKind, type Prisma, type UserRole } from "@prisma/client";
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

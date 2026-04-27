import Image from "next/image";
import Link from "next/link";
import type { EpisodeListItem } from "@/lib/episodes";
import { formatDuration, formatPublishDate } from "@/lib/format";

export function EpisodeCard({ episode }: { episode: EpisodeListItem }) {
  const thumbnail = episode.mediaAssets.find((asset) => asset.kind === "THUMBNAIL");
  const hasVideo = episode.mediaAssets.some((asset) => asset.kind === "VIDEO");
  const progressPercent =
    episode.playbackProgress.length > 0 && episode.durationSeconds > 0
      ? Math.min(
          100,
          Math.round(
            (episode.playbackProgress[0].positionSeconds / episode.durationSeconds) * 100,
          ),
        )
      : 0;

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className="group grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/[0.07] sm:grid-cols-[180px_1fr]"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
        {thumbnail ? (
          <Image
            src={`/api/media/${thumbnail.id}`}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 640px) 180px, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-500 text-3xl font-black">
            CS
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          {hasVideo ? "Video" : "Audio"}
        </span>
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
            <span>{formatPublishDate(episode.publishedAt)}</span>
            <span>•</span>
            <span>{formatDuration(episode.durationSeconds)}</span>
          </div>
          <h2 className="line-clamp-2 text-xl font-bold tracking-tight text-white">
            {episode.title}
          </h2>
          {episode.subtitle ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
              {episode.subtitle}
            </p>
          ) : null}
        </div>
        {progressPercent > 0 ? (
          <div>
            <div className="mb-1 text-xs text-slate-400">{progressPercent}% complete</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

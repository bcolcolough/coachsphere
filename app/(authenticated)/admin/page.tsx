import Link from "next/link";
import { EpisodeStatus } from "@prisma/client";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { formatDuration, formatPublishedDate } from "@/lib/format";

export default async function AdminDashboardPage() {
  await requireAdminSession();
  const episodes = await prisma.episode.findMany({
    include: {
      mediaAssets: true,
      chapters: true,
      notificationEvents: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="flex flex-col justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">Publishing dashboard</h1>
          <p className="mt-2 text-slate-300">
            Create drafts, upload private MP4/M4A media, add chapters, and publish to Slack.
          </p>
        </div>
        <LinkButton href="/admin/episodes/new">New episode</LinkButton>
      </section>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70">
        {episodes.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No episodes yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {episodes.map((episode) => {
              const mediaKinds = episode.mediaAssets.map((asset) => asset.kind).join(", ") || "No media";
              return (
                <Link
                  className="grid gap-4 p-5 transition hover:bg-white/[0.04] md:grid-cols-[1fr_160px_160px_140px]"
                  href={`/admin/episodes/${episode.id}/edit`}
                  key={episode.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-white">{episode.title}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          episode.status === EpisodeStatus.PUBLISHED
                            ? "bg-emerald-400/15 text-emerald-200"
                            : "bg-amber-400/15 text-amber-200"
                        }`}
                      >
                        {episode.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                      {episode.description}
                    </p>
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="block text-slate-500">Published</span>
                    {formatPublishedDate(episode.publishedAt)}
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="block text-slate-500">Duration</span>
                    {formatDuration(episode.durationSeconds)}
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="block text-slate-500">Assets</span>
                    {mediaKinds}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

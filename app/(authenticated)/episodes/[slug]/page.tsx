import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EpisodePlayer } from "@/components/episode-player";
import { getEpisodeBySlug } from "@/lib/episodes";
import { formatDuration } from "@/lib/format";

type EpisodePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    notFound();
  }
  const episode = await getEpisodeBySlug(
    slug,
    session.user.id,
    session.user.role,
  );

  if (!episode) {
    notFound();
  }

  const thumbnail = episode.mediaAssets.find((asset) => asset.kind === "THUMBNAIL");
  const audio = episode.mediaAssets.find((asset) => asset.kind === "AUDIO");
  const video = episode.mediaAssets.find((asset) => asset.kind === "VIDEO");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <Link className="text-sm font-medium text-cyan-200 hover:text-cyan-100" href="/">
        ← Back to the show
      </Link>
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- Private authenticated media URL.
            <img
              alt=""
              className="aspect-video h-full w-full object-cover"
              src={`/api/media/${thumbnail.id}`}
            />
          ) : (
            <div className="aspect-video bg-gradient-to-br from-violet-600 to-cyan-400" />
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            {episode.status === "DRAFT" ? "Draft episode" : "Now playing"}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            {episode.title}
          </h1>
          {episode.subtitle ? (
            <p className="mt-3 text-xl text-slate-300">{episode.subtitle}</p>
          ) : null}
          <p className="mt-5 text-sm text-slate-400">
            {formatDuration(episode.durationSeconds)} •{" "}
            {episode.publishedAt?.toLocaleDateString("en", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }) ?? "Unpublished"}
          </p>
        </div>
      </section>
      <EpisodePlayer
        audio={audio}
        chapters={episode.chapters}
        episodeId={episode.id}
        initialPositionSeconds={episode.playbackProgress[0]?.positionSeconds ?? 0}
        thumbnailUrl={thumbnail ? `/api/media/${thumbnail.id}` : undefined}
        title={episode.title}
        video={video}
      />
      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">Episode notes</h2>
          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
            {episode.showNotes ?? episode.description}
          </p>
        </article>
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold text-white">Chapters</h2>
          <ol className="mt-4 space-y-3">
            {episode.chapters.map((chapter) => (
              <li
                className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3 text-sm"
                key={chapter.id}
              >
                <span className="font-medium text-slate-100">{chapter.title}</span>
                <span className="text-slate-400">{formatDuration(chapter.startSeconds)}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </div>
  );
}

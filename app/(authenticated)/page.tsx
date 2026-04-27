import { EpisodeCard } from "@/components/episode-card";
import { getPublishedEpisodesForUser } from "@/lib/episodes";
import { requireUser } from "@/lib/session";

export default async function AuthenticatedHomePage() {
  const session = await requireUser();
  const episodes = await getPublishedEpisodesForUser(session.user.id);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/20 via-slate-950 to-cyan-500/10 p-8 shadow-2xl shadow-violet-950/20 sm:p-10">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
            Cursor GTM private channel
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Stories, concepts, and operating ideas for the team.
          </h1>
          <p className="text-lg leading-8 text-slate-300">
            Watch the video, switch to audio-only on the go, and jump directly
            to chapters that matter. New drops are announced in Slack.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Latest episodes
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Continue learning
            </h2>
          </div>
          <p className="text-sm text-slate-500">{episodes.length} published</p>
        </div>

        {episodes.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {episodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/60 p-10 text-center">
            <p className="text-lg font-semibold text-white">No episodes yet</p>
            <p className="mt-2 text-slate-400">
              Published internal episodes will appear here after an admin posts
              the first drop.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

import { EpisodeForm } from "@/components/admin/episode-form";

export default function NewEpisodePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
          Create episode
        </h1>
      </div>
      <EpisodeForm />
    </div>
  );
}

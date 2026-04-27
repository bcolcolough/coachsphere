import { notFound } from "next/navigation";
import { EpisodeForm } from "@/components/admin/episode-form";
import { requireAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type EditEpisodePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEpisodePage({ params }: EditEpisodePageProps) {
  await requireAdminSession();
  const { id } = await params;
  const episode = await prisma.episode.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { startSeconds: "asc" },
      },
      mediaAssets: true,
    },
  });

  if (!episode) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <EpisodeForm episode={episode} />
    </div>
  );
}

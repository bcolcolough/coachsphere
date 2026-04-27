import { NotificationStatus, type Episode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationEpisode = Pick<
  Episode,
  "id" | "slug" | "title" | "description" | "publishedAt"
>;

type NotificationProvider = {
  id: string;
  sendEpisodePublished: (episode: NotificationEpisode) => Promise<void>;
};

function appUrl() {
  return (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function episodeUrl(episode: NotificationEpisode) {
  return `${appUrl()}/episodes/${episode.slug}`;
}

function configuredProviders(): NotificationProvider[] {
  const providers: NotificationProvider[] = [];

  if (process.env.SLACK_WEBHOOK_URL) {
    providers.push({
      id: "slack",
      async sendEpisodePublished(episode) {
        const response = await fetch(process.env.SLACK_WEBHOOK_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `New CoachSphere episode: ${episode.title}`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*:studio_microphone: New CoachSphere episode*\n*<${episodeUrl(
                    episode,
                  )}|${episode.title}>*\n${episode.description}`,
                },
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Slack webhook failed with ${response.status}`);
        }
      },
    });
  }

  if (providers.length === 0 && process.env.NODE_ENV !== "production") {
    providers.push({
      id: "console",
      async sendEpisodePublished(episode) {
        console.info("CoachSphere episode published", {
          title: episode.title,
          url: episodeUrl(episode),
        });
      },
    });
  }

  return providers;
}

export async function sendEpisodePublishedNotifications(episode: NotificationEpisode) {
  const providers = configuredProviders();

  for (const provider of providers) {
    const existing = await prisma.notificationEvent.findUnique({
      where: {
        episodeId_provider: {
          episodeId: episode.id,
          provider: provider.id,
        },
      },
    });

    if (existing?.status === NotificationStatus.SUCCESS) {
      continue;
    }

    try {
      await provider.sendEpisodePublished(episode);
      await prisma.notificationEvent.upsert({
        where: {
          episodeId_provider: {
            episodeId: episode.id,
            provider: provider.id,
          },
        },
        update: {
          status: NotificationStatus.SUCCESS,
          error: null,
          sentAt: new Date(),
        },
        create: {
          episodeId: episode.id,
          provider: provider.id,
          status: NotificationStatus.SUCCESS,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.notificationEvent.upsert({
        where: {
          episodeId_provider: {
            episodeId: episode.id,
            provider: provider.id,
          },
        },
        update: {
          status: NotificationStatus.FAILED,
          error: error instanceof Error ? error.message : "Unknown notification error",
        },
        create: {
          episodeId: episode.id,
          provider: provider.id,
          status: NotificationStatus.FAILED,
          error: error instanceof Error ? error.message : "Unknown notification error",
        },
      });
    }
  }
}

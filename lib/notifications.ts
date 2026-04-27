import nodemailer from "nodemailer";
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

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_FROM &&
    (process.env.NOTIFICATION_EMAILS || process.env.NODE_ENV !== "production")
  ) {
    providers.push({
      id: "email",
      async sendEpisodePublished(episode) {
        const configuredRecipients = (process.env.NOTIFICATION_EMAILS ?? "")
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean);
        const signedInRecipients = await prisma.user.findMany({
          select: { email: true },
          where: { email: { not: "" } },
        });
        const recipients = Array.from(
          new Set([
            ...configuredRecipients,
            ...signedInRecipients.map((user) => user.email),
          ]),
        );

        if (recipients.length === 0) {
          return;
        }

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASSWORD
              ? {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASSWORD,
                }
              : undefined,
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: recipients,
          subject: `New CoachSphere episode: ${episode.title}`,
          text: `${episode.title}\n\n${episode.description}\n\nWatch or listen: ${episodeUrl(
            episode,
          )}`,
        });
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

export async function sendTestNotification() {
  const testEpisode: NotificationEpisode = {
    id: "test-notification",
    slug: "welcome-to-coachsphere",
    title: "CoachSphere test notification",
    description:
      "This is a test notification from the CoachSphere admin console.",
    publishedAt: new Date(),
  };

  const providers = configuredProviders();
  for (const provider of providers) {
    await provider.sendEpisodePublished(testEpisode);
  }

  return { providers: providers.map((provider) => provider.id) };
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { UserRole } from "@prisma/client";
import { uploadRoot } from "@/lib/media";
import { prisma } from "@/lib/prisma";

async function seed() {
  await mkdir(uploadRoot, { recursive: true });

  const thumbKey = "seed/coachsphere-thumb.svg";
  const thumbPath = path.join(uploadRoot, thumbKey);
  const audioKey = "seed/welcome-tone.m4a";
  const audioPath = path.join(uploadRoot, audioKey);
  await mkdir(path.dirname(thumbPath), { recursive: true });
  await writeFile(
    thumbPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#g)" />
      <circle cx="1010" cy="180" r="140" fill="#22d3ee" opacity=".35" />
      <circle cx="270" cy="550" r="180" fill="#34d399" opacity=".28" />
      <text x="90" y="310" fill="#ffffff" font-family="Inter, Arial" font-size="74" font-weight="800">CoachSphere</text>
      <text x="96" y="390" fill="#c4b5fd" font-family="Inter, Arial" font-size="34">Internal GTM stories, concepts, and ideas</text>
    </svg>`,
    "utf8",
  );
  const m4aStub = Buffer.from(
    "AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVl",
    "base64",
  );
  await writeFile(audioPath, m4aStub);

  const admin = await prisma.user.upsert({
    where: { email: "admin@anysphere.co" },
    update: { role: UserRole.ADMIN, name: "CoachSphere Admin" },
    create: {
      email: "admin@anysphere.co",
      name: "CoachSphere Admin",
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@anysphere.co" },
    update: { role: UserRole.USER, name: "CoachSphere Listener" },
    create: {
      email: "user@anysphere.co",
      name: "CoachSphere Listener",
      role: UserRole.USER,
    },
  });

  await prisma.episode.upsert({
    where: { slug: "welcome-to-coachsphere" },
    update: {},
    create: {
      slug: "welcome-to-coachsphere",
      title: "Welcome to CoachSphere",
      subtitle: "A private channel for GTM learning loops",
      description:
        "A sample published episode showing the internal podcast/video experience. Upload MP4 or M4A media from the admin console to replace this placeholder.",
      showNotes:
        "This seeded episode demonstrates metadata, private thumbnails, chapters, and published visibility. Add real internal stories from the admin view.",
      durationSeconds: 905,
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdById: admin.id,
      mediaAssets: {
        create: [
          {
            kind: "THUMBNAIL",
            storageKey: thumbKey,
            mimeType: "image/svg+xml",
            sizeBytes: (await readFile(thumbPath)).byteLength,
          },
          {
            kind: "AUDIO",
            storageKey: audioKey,
            mimeType: "audio/mp4",
            sizeBytes: m4aStub.byteLength,
            durationSeconds: 905,
          },
        ],
      },
      chapters: {
        create: [
          { title: "Why this channel exists", startSeconds: 0, sortOrder: 0 },
          { title: "How GTM stories compound", startSeconds: 185, sortOrder: 1 },
          { title: "What to publish next", startSeconds: 620, sortOrder: 2 },
        ],
      },
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

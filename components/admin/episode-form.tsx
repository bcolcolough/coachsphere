"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";

type Asset = {
  id: string;
  kind: "THUMBNAIL" | "AUDIO" | "VIDEO";
  originalName: string | null;
  mimeType: string;
  sizeBytes: number;
};

type ChapterFormState = {
  id?: string;
  title: string;
  startSeconds: number;
};

type EpisodeFormProps = {
  episode?: {
    id: string;
    title: string;
    subtitle: string | null;
    description: string;
    showNotes: string | null;
    durationSeconds: number;
    status: "DRAFT" | "PUBLISHED";
    mediaAssets: Asset[];
    chapters: ChapterFormState[];
  };
};

type UploadState = {
  thumbnailAssetId?: string;
  audioAssetId?: string;
  videoAssetId?: string;
};

function initialUploads(assets: Asset[]): UploadState {
  return {
    thumbnailAssetId: assets.find((asset) => asset.kind === "THUMBNAIL")?.id,
    audioAssetId: assets.find((asset) => asset.kind === "AUDIO")?.id,
    videoAssetId: assets.find((asset) => asset.kind === "VIDEO")?.id,
  };
}

function assetLabel(asset?: Asset) {
  if (!asset) return "No file selected";
  return `${asset.originalName ?? asset.id} · ${(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

export function EpisodeForm({ episode }: EpisodeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(episode?.title ?? "");
  const [subtitle, setSubtitle] = useState(episode?.subtitle ?? "");
  const [description, setDescription] = useState(episode?.description ?? "");
  const [showNotes, setShowNotes] = useState(episode?.showNotes ?? "");
  const [durationSeconds, setDurationSeconds] = useState(episode?.durationSeconds ?? 0);
  const [chapters, setChapters] = useState<ChapterFormState[]>(
    episode?.chapters.length ? episode.chapters : [{ title: "Opening", startSeconds: 0 }],
  );
  const [assets, setAssets] = useState<Asset[]>(episode?.mediaAssets ?? []);
  const [uploads, setUploads] = useState<UploadState>(initialUploads(episode?.mediaAssets ?? []));
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const assetsById = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  );

  async function upload(kind: "THUMBNAIL" | "AUDIO" | "VIDEO", file: File | undefined) {
    if (!file) return;
    setUploadingKind(kind);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed");
      }
      setAssets((current) => [...current.filter((asset) => asset.kind !== kind), payload.asset]);
      setUploads((current) => ({
        ...current,
        [`${kind.toLowerCase()}AssetId`]: payload.asset.id,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingKind(null);
    }
  }

  function setChapter(index: number, patch: Partial<ChapterFormState>) {
    setChapters((current) =>
      current.map((chapter, chapterIndex) =>
        chapterIndex === index ? { ...chapter, ...patch } : chapter,
      ),
    );
  }

  async function save(nextStatus?: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        episode ? `/api/admin/episodes/${episode.id}` : "/api/admin/episodes",
        {
          method: episode ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            subtitle,
            description,
            showNotes,
            durationSeconds,
            status: nextStatus ?? episode?.status ?? "DRAFT",
            ...uploads,
            chapters,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save episode");
      }
      const episodeId = payload.episode?.id ?? payload.id;
      if (nextStatus === "PUBLISHED") {
        if (!episodeId) {
          throw new Error("Saved episode, but the response did not include an episode id");
        }
        const publishResponse = await fetch(`/api/admin/episodes/${episodeId}/publish`, {
          method: "POST",
        });
        if (!publishResponse.ok) {
          const publishPayload = await publishResponse.json();
          throw new Error(publishPayload.error ?? "Saved draft, but publish failed");
        }
      }
      router.push("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save episode");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      <form className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Title</span>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
            onChange={(event) => setTitle(event.currentTarget.value)}
            required
            value={title}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Subtitle</span>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
            onChange={(event) => setSubtitle(event.currentTarget.value)}
            value={subtitle}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Description</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
            onChange={(event) => setDescription(event.currentTarget.value)}
            required
            value={description}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Show notes</span>
          <textarea
            className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
            onChange={(event) => setShowNotes(event.currentTarget.value)}
            value={showNotes}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Duration seconds</span>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
            min={0}
            onChange={(event) => setDurationSeconds(Number(event.currentTarget.value))}
            type="number"
            value={durationSeconds}
          />
          <span className="mt-1 block text-xs text-slate-500">
            Displays as {formatDuration(durationSeconds)}
          </span>
        </label>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Chapters</h2>
            <Button
              onClick={() => setChapters((current) => [...current, { title: "", startSeconds: 0 }])}
              size="sm"
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {chapters.map((chapter, index) => (
              <div className="grid grid-cols-[1fr_120px_auto] gap-2" key={chapter.id ?? index}>
                <input
                  aria-label="Chapter title"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
                  onChange={(event) => setChapter(index, { title: event.currentTarget.value })}
                  placeholder="Chapter title"
                  value={chapter.title}
                />
                <input
                  aria-label="Chapter start seconds"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
                  min={0}
                  onChange={(event) =>
                    setChapter(index, { startSeconds: Number(event.currentTarget.value) })
                  }
                  type="number"
                  value={chapter.startSeconds}
                />
                <Button
                  aria-label="Remove chapter"
                  onClick={() => setChapters((current) => current.filter((_, i) => i !== index))}
                  size="sm"
                  variant="danger"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </form>

      <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold text-white">Private media</h2>
        {([
          ["THUMBNAIL", "Thumbnail", uploads.thumbnailAssetId],
          ["AUDIO", "M4A/MP4 audio", uploads.audioAssetId],
          ["VIDEO", "MP4 video", uploads.videoAssetId],
        ] as const).map(([kind, label, assetId]) => (
          <label className="block rounded-2xl border border-white/10 bg-slate-950 p-4" key={kind}>
            <span className="text-sm font-semibold text-slate-200">{label}</span>
            <span className="mt-1 block text-xs text-slate-500">
              {assetLabel(assetId ? assetsById.get(assetId) : undefined)}
            </span>
            <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white">
              <Upload className="h-4 w-4" />
              {uploadingKind === kind ? "Uploading…" : "Upload"}
            </span>
            <input
              className="sr-only"
              disabled={uploadingKind === kind}
              onChange={(event) => void upload(kind, event.currentTarget.files?.[0])}
              type="file"
            />
          </label>
        ))}
        {message ? (
          <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            {message}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 pt-2">
          <Button disabled={saving} onClick={() => void save("DRAFT")}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button disabled={saving} onClick={() => void save("PUBLISHED")} variant="secondary">
            Publish + notify
          </Button>
          <LinkButton href="/admin" variant="ghost">
            Cancel
          </LinkButton>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Video } from "lucide-react";
import { ChapterList, type PlayerChapter } from "@/components/chapter-list";
import { PlaybackControls } from "@/components/playback-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MediaAsset = {
  id: string;
  kind: "AUDIO" | "VIDEO" | "THUMBNAIL";
  mimeType: string;
};

type EpisodePlayerProps = {
  episodeId: string;
  title: string;
  thumbnailUrl?: string;
  audio?: MediaAsset | null;
  video?: MediaAsset | null;
  chapters: PlayerChapter[];
  initialPositionSeconds?: number;
};

function mediaUrl(asset?: MediaAsset | null) {
  return asset ? `/api/media/${asset.id}` : undefined;
}

export function EpisodePlayer({
  episodeId,
  title,
  thumbnailUrl,
  audio,
  video,
  chapters,
  initialPositionSeconds = 0,
}: EpisodePlayerProps) {
  const [preferredMode, setPreferredMode] = useState<"video" | "audio">(video ? "video" : "audio");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const lastSavedPosition = useRef(initialPositionSeconds);

  const mode = preferredMode === "video" && !video ? "audio" : preferredMode;
  const activeAsset = mode === "video" && video ? video : audio ?? video;
  const activeUrl = mediaUrl(activeAsset);
  const hasVideo = Boolean(video);
  const hasAudio = Boolean(audio);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.playbackRate = speed;
  }, [speed, mode]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || initialPositionSeconds <= 0) return;

    const restorePosition = () => {
      media.currentTime = initialPositionSeconds;
      setCurrentTime(initialPositionSeconds);
    };

    if (media.readyState >= 1) {
      restorePosition();
    } else {
      media.addEventListener("loadedmetadata", restorePosition, { once: true });
    }
  }, [initialPositionSeconds, activeUrl]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const media = mediaRef.current;
      if (!media) return;
      const positionSeconds = Math.floor(media.currentTime);
      if (Math.abs(positionSeconds - lastSavedPosition.current) < 10) {
        return;
      }
      lastSavedPosition.current = positionSeconds;
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId,
          positionSeconds,
          completed:
            media.duration > 0 && media.currentTime / media.duration > 0.92,
        }),
      });
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [episodeId]);

  async function togglePlay() {
    const media = mediaRef.current;
    if (!media) return;

    if (media.paused) {
      await media.play();
      setIsPlaying(true);
    } else {
      media.pause();
      setIsPlaying(false);
    }
  }

  function skip(deltaSeconds: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(media.duration || Number.MAX_SAFE_INTEGER, media.currentTime + deltaSeconds));
    setCurrentTime(media.currentTime);
  }

  function seekTo(seconds: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = seconds;
    setCurrentTime(seconds);
  }

  function changeSpeed(nextSpeed: number) {
    setSpeed(nextSpeed);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = nextSpeed;
    }
  }

  if (!activeUrl) {
    return (
      <div className="rounded-[2rem] border border-amber-400/30 bg-amber-400/10 p-6 text-amber-100">
        This episode does not have playable media yet.
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="flex gap-2">
            {hasVideo ? (
              <Button
                aria-pressed={mode === "video"}
                className={cn(mode !== "video" && "bg-transparent")}
                onClick={() => setPreferredMode("video")}
                size="sm"
                variant={mode === "video" ? "primary" : "secondary"}
              >
                <Video className="h-4 w-4" />
                Video
              </Button>
            ) : null}
            <Button
              aria-pressed={mode === "audio"}
              disabled={!hasAudio && !video}
              onClick={() => setPreferredMode("audio")}
              size="sm"
              variant={mode === "audio" ? "primary" : "secondary"}
            >
              <Headphones className="h-4 w-4" />
              Audio
            </Button>
          </div>
        </div>

        <div className="bg-black">
          {mode === "video" && video ? (
            <video
              className="aspect-video w-full bg-black"
              controls={false}
              onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              playsInline
              poster={thumbnailUrl}
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={activeUrl}
            />
          ) : (
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-slate-950">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- Private authenticated media URL.
                <img
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-60 blur-sm"
                  src={thumbnailUrl}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 to-violet-950/70" />
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-white/10 p-5 text-cyan-200">
                  <Headphones className="h-10 w-10" />
                </div>
                <p className="max-w-sm px-6 text-lg font-semibold text-white">
                  Audio-only mode
                </p>
              </div>
              <audio
                onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={activeUrl}
              />
            </div>
          )}
        </div>

        <PlaybackControls
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onRateChange={changeSpeed}
          onSeek={seekTo}
          onSkip={skip}
          playbackRate={speed}
        />
      </div>

      <ChapterList
        chapters={chapters}
        currentTime={currentTime}
        onSelect={seekTo}
      />
    </section>
  );
}

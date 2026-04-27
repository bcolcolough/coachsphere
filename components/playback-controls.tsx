"use client";

import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";

type PlaybackControlsProps = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (seconds: number) => void;
  onRateChange: (rate: number) => void;
};

const speedOptions = [0.75, 1, 1.25, 1.5, 2];

export function PlaybackControls({
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  onPlayPause,
  onSkip,
  onSeek,
  onRateChange,
}: PlaybackControlsProps) {
  const progressValue = duration > 0 ? currentTime : 0;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-400">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
      <input
        aria-label="Playback position"
        className="mt-3 w-full accent-violet-300"
        max={Math.max(duration, 0)}
        min={0}
        onChange={(event) => onSeek(Number(event.currentTarget.value))}
        step={1}
        type="range"
        value={progressValue}
      />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button
          aria-label="Rewind 15 seconds"
          onClick={() => onSkip(-15)}
          size="sm"
          variant="secondary"
        >
          <RotateCcw className="h-4 w-4" />
          15s
        </Button>
        <Button
          aria-label={isPlaying ? "Pause episode" : "Play episode"}
          className="min-w-28"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button
          aria-label="Fast forward 15 seconds"
          onClick={() => onSkip(15)}
          size="sm"
          variant="secondary"
        >
          15s
          <RotateCw className="h-4 w-4" />
        </Button>
        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200">
          Speed
          <select
            className="bg-transparent font-semibold text-white outline-none"
            onChange={(event) => onRateChange(Number(event.currentTarget.value))}
            value={playbackRate}
          >
            {speedOptions.map((speed) => (
              <option className="bg-slate-950" key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

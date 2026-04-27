"use client";

import { formatDuration } from "@/lib/format";

export type PlayerChapter = {
  id: string;
  title: string;
  startSeconds: number;
};

type ChapterListProps = {
  chapters: PlayerChapter[];
  currentTime: number;
  onSelect: (startSeconds: number) => void;
};

export function ChapterList({ chapters, currentTime, onSelect }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
        No chapters have been added yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter, index) => {
        const nextChapter = chapters[index + 1];
        const isActive =
          currentTime >= chapter.startSeconds &&
          (!nextChapter || currentTime < nextChapter.startSeconds);

        return (
          <button
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
              isActive
                ? "border-cyan-300/50 bg-cyan-300/10 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
            }`}
            key={chapter.id}
            onClick={() => onSelect(chapter.startSeconds)}
            type="button"
          >
            <span className="font-medium">{chapter.title}</span>
            <span className="text-sm text-slate-400">
              {formatDuration(chapter.startSeconds)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

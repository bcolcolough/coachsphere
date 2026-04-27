import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EpisodePlayer } from "@/components/episode-player";

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();

describe("EpisodePlayer", () => {
  it("renders audio mode, speed controls, and selectable chapters", () => {
    render(
      <EpisodePlayer
        audio={{ id: "audio-1", kind: "AUDIO", mimeType: "audio/mp4" }}
        chapters={[
          { id: "chapter-1", title: "Intro", startSeconds: 0 },
          { id: "chapter-2", title: "Main idea", startSeconds: 30 },
        ]}
        episodeId="episode-1"
        thumbnailUrl="/api/media/thumb"
        title="Test episode"
      />,
    );

    expect(screen.getByText("Audio-only mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play episode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Main idea/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Speed"), { target: { value: "1.5" } });
    expect(screen.getByLabelText("Speed")).toHaveValue("1.5");
  });
});

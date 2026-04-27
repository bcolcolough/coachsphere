import { describe, expect, it } from "vitest";
import { slugifyTitle } from "@/lib/episodes";

describe("slugifyTitle", () => {
  it("creates stable URL-safe episode slugs", () => {
    expect(slugifyTitle("GTM Lessons: How Cursor Wins!")).toBe(
      "gtm-lessons-how-cursor-wins",
    );
  });

  it("falls back when a title has no slug characters", () => {
    expect(slugifyTitle("!!!")).toBe("episode");
  });
});

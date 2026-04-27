import { describe, expect, it } from "vitest";
import { validateUpload } from "@/lib/upload-validation";

describe("validateUpload", () => {
  it("accepts browser playable MP4/M4A media", () => {
    expect(validateUpload({ kind: "AUDIO", mimeType: "audio/mp4", sizeBytes: 1024 }).ok).toBe(true);
    expect(validateUpload({ kind: "AUDIO", mimeType: "audio/x-m4a", sizeBytes: 1024 }).ok).toBe(true);
    expect(validateUpload({ kind: "VIDEO", mimeType: "video/mp4", sizeBytes: 1024 }).ok).toBe(true);
  });

  it("rejects mismatched media kinds and oversized files", () => {
    expect(validateUpload({ kind: "THUMBNAIL", mimeType: "video/mp4", sizeBytes: 1024 })).toEqual({
      ok: false,
      error: "thumbnail uploads must use one of: image/jpeg, image/png, image/webp, image/svg+xml",
    });

    expect(validateUpload({ kind: "THUMBNAIL", mimeType: "image/png", sizeBytes: 11 * 1024 * 1024 })).toEqual({
      ok: false,
      error: "thumbnail upload exceeds 10MB.",
    });
  });
});

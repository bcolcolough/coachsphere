import { describe, expect, it, vi } from "vitest";
import { isAdminCandidate, parseGroups, roleForIdentity } from "@/lib/admin";

describe("admin helpers", () => {
  it("parses Okta group claims from arrays and comma-separated strings", () => {
    expect(parseGroups(["CoachSphere Admins", 42, "GTM"])).toEqual([
      "CoachSphere Admins",
      "GTM",
    ]);
    expect(parseGroups("CoachSphere Admins, GTM")).toEqual([
      "CoachSphere Admins",
      "GTM",
    ]);
  });

  it("detects admins by configured email and group", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@anysphere.co");
    vi.stubEnv("OKTA_ADMIN_GROUPS", "CoachSphere Admins");

    expect(isAdminCandidate({ email: "ADMIN@anysphere.co" })).toBe(true);
    expect(isAdminCandidate({ groups: ["CoachSphere Admins"] })).toBe(true);
    expect(roleForIdentity({ email: "listener@anysphere.co" })).toBe("USER");

    vi.unstubAllEnvs();
  });
});

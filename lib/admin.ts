import { UserRole } from "@prisma/client";

type AdminCandidate = {
  email?: string | null;
  role?: UserRole | string | null;
  groups?: unknown;
};

function splitEnvList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function parseGroups(groups: unknown): string[] {
  if (Array.isArray(groups)) {
    return groups.filter((group): group is string => typeof group === "string");
  }

  if (typeof groups === "string") {
    return splitEnvList(groups);
  }

  return [];
}

export function configuredAdminEmails() {
  return splitEnvList(process.env.ADMIN_EMAILS).map((email) =>
    email.toLowerCase(),
  );
}

export function configuredAdminGroups() {
  return splitEnvList(process.env.OKTA_ADMIN_GROUPS);
}

export function isAdminCandidate(candidate: AdminCandidate) {
  if (candidate.role === UserRole.ADMIN || candidate.role === "ADMIN") {
    return true;
  }

  const email = normalizeEmail(candidate.email);
  if (email && configuredAdminEmails().includes(email)) {
    return true;
  }

  const groups = new Set(parseGroups(candidate.groups));
  return configuredAdminGroups().some((adminGroup) => groups.has(adminGroup));
}

export function roleForIdentity(candidate: AdminCandidate) {
  return isAdminCandidate(candidate) ? UserRole.ADMIN : UserRole.USER;
}

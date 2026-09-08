import { randomUUID } from "node:crypto";

export type UserInvitationInput = {
  name: string;
  email: string;
  jobTitle?: string | null;
  areaId?: number | null;
  companyId?: number | null;
  roleProfileId?: number | null;
  phone?: string | null;
};

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function buildInvitedUser(input: UserInvitationInput) {
  return {
    ...input,
    email: normalizeInvitationEmail(input.email),
    openId: `invited:${randomUUID()}`,
    status: "invited" as const,
    lastSignedIn: null,
  };
}

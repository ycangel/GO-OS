import { and, eq } from "drizzle-orm";
import { getDb, getRuntimeVariable } from "../db";
import { members, missionMemberships } from "../db/schema";
import { getChatGPTUser, type ChatGPTUser } from "./chatgpt-auth";

export type RuntimeMember = {
  id: number;
  displayName: string;
  publicAlias: string;
  namePublic: boolean;
  role: string;
  status: string;
  isOwner: boolean;
};

export type RuntimeIdentity = {
  user: ChatGPTUser | null;
  member: RuntimeMember | null;
};

export async function getRuntimeIdentity(): Promise<RuntimeIdentity> {
  const user = await getChatGPTUser();
  if (!user) return { user: null, member: null };
  if (!user.email) return { user, member: null };

  const email = normalizeEmail(user.email);
  const ownerEmail = normalizeEmail(
    getRuntimeVariable("GO_SOCIETY_OWNER_EMAIL") ?? "",
  );

  try {
    const db = getDb();

    if (ownerEmail && email === ownerEmail) {
      const [owner] = await db
        .select()
        .from(members)
        .where(and(eq(members.role, "owner"), eq(members.status, "active")))
        .limit(1);

      if (owner) {
        return {
          user,
          member: {
            id: owner.id,
            displayName: user.displayName,
            publicAlias: owner.publicAlias,
            namePublic: owner.namePublic,
            role: owner.role,
            status: owner.status,
            isOwner: true,
          },
        };
      }
    }

    const [record] = await db
      .select()
      .from(members)
      .where(eq(members.email, email))
      .limit(1);

    if (!record || !["invited", "active"].includes(record.status)) {
      return { user, member: null };
    }
    if (record.expiresAt) {
      const expiresAt = Date.parse(record.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        return { user, member: null };
      }
    }

    const [membership] = await db
      .select({ id: missionMemberships.id })
      .from(missionMemberships)
      .where(
        and(
          eq(missionMemberships.memberId, record.id),
          eq(missionMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!membership) return { user, member: null };

    return {
      user,
      member: {
        id: record.id,
        displayName: record.displayName,
        publicAlias: record.publicAlias,
        namePublic: record.namePublic,
        role: record.role,
        status: record.status,
        isOwner: record.role === "owner",
      },
    };
  } catch {
    return { user, member: null };
  }
}

export async function canRecordMission(
  member: RuntimeMember,
  missionId: number,
): Promise<boolean> {
  if (member.isOwner) return true;

  const db = getDb();
  const [permission] = await db
    .select({ id: missionMemberships.id })
    .from(missionMemberships)
    .where(
      and(
        eq(missionMemberships.memberId, member.id),
        eq(missionMemberships.missionId, missionId),
        eq(missionMemberships.canRecord, true),
        eq(missionMemberships.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(permission);
}

export async function canAccessMission(
  member: RuntimeMember,
  missionId: number,
): Promise<boolean> {
  if (member.isOwner) return true;

  const db = getDb();
  const [membership] = await db
    .select({ id: missionMemberships.id })
    .from(missionMemberships)
    .where(
      and(
        eq(missionMemberships.memberId, member.id),
        eq(missionMemberships.missionId, missionId),
        eq(missionMemberships.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(membership);
}

export async function canReviewMission(
  member: RuntimeMember,
  missionId: number,
): Promise<boolean> {
  if (member.isOwner) return true;

  const db = getDb();
  const [permission] = await db
    .select({ id: missionMemberships.id })
    .from(missionMemberships)
    .where(
      and(
        eq(missionMemberships.memberId, member.id),
        eq(missionMemberships.missionId, missionId),
        eq(missionMemberships.canReview, true),
        eq(missionMemberships.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(permission);
}

export function mutationCameFromSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const configuredOrigin = getRuntimeVariable("GO_PUBLIC_ORIGIN")?.trim();
    const expectedOrigin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : new URL(request.url).origin;
    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

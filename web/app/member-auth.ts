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

export type OwnerBootstrapConfiguration = {
  issuer: string;
  subject: string;
  email: string;
};

export function getOwnerBootstrapConfiguration(): OwnerBootstrapConfiguration {
  return {
    issuer: getRuntimeVariable("GO_OAUTH_ISSUER")?.trim() ?? "",
    subject: getRuntimeVariable("GO_SOCIETY_OWNER_SUBJECT")?.trim() ?? "",
    email: normalizeEmail(
      getRuntimeVariable("GO_SOCIETY_OWNER_EMAIL") ?? "",
    ),
  };
}

export function matchesOwnerBootstrapIdentity(
  user: ChatGPTUser,
  configuration: OwnerBootstrapConfiguration,
): boolean {
  const subject = configuration.subject.trim();
  const issuer = configuration.issuer.trim();
  if (subject) {
    if (!issuer || user.authenticationMethod === "sites") return false;
    return user.principalKey === `oidc:${issuer}\u0000${subject}`;
  }

  const configuredEmail = normalizeEmail(configuration.email);
  return Boolean(
    user.authenticationMethod === "sites" &&
      configuredEmail &&
      user.email &&
      normalizeEmail(user.email) === configuredEmail,
  );
}

export async function getRuntimeIdentity(): Promise<RuntimeIdentity> {
  const user = await getChatGPTUser();
  if (!user) return { user: null, member: null };

  const email = user.email ? normalizeEmail(user.email) : null;
  const isConfiguredOwner = matchesOwnerBootstrapIdentity(
    user,
    getOwnerBootstrapConfiguration(),
  );

  try {
    const db = getDb();

    if (isConfiguredOwner) {
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

    // Email lookup is retained only for the native Sites compatibility
    // adapter, whose host attests the identity headers. Self-hosted OIDC and
    // trusted-proxy identities must use stable-subject membership paths.
    if (!email || user.authenticationMethod !== "sites") {
      return { user, member: null };
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

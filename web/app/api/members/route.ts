import { getDb } from "../../../db";
import { members, missionMemberships } from "../../../db/schema";
import {
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
  normalizeEmail,
} from "../../member-auth";

export async function POST(request: Request) {
  if (!mutationCameFromSameOrigin(request)) {
    return Response.json({ error: "Cross-origin writes are not allowed." }, { status: 403 });
  }

  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in to invite a member." }, { status: 401 });
  }
  if (!identity.member?.isOwner) {
    return Response.json(
      { error: "Only the GO Society owner can add mission partners." },
      { status: 403 },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(String(payload.email ?? ""));
    const displayName = String(payload.displayName ?? "").trim().slice(0, 80);
    const missionId = Number(payload.missionId);
    const publicNameConsent =
      payload.publicNameConsent === true || payload.publicNameConsent === "on";

    if (!isEmail(email) || !displayName || !Number.isInteger(missionId)) {
      return Response.json(
        { error: "A valid ChatGPT login email, internal name and mission are required." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [member] = await db
      .insert(members)
      .values({
        email,
        displayName,
        publicAlias: publicNameConsent
          ? displayName
          : "Enterprise Reality Mission Partner",
        namePublic: publicNameConsent,
        role: "mission_partner",
        status: "invited",
      })
      .onConflictDoUpdate({
        target: members.email,
        set: {
          displayName,
          publicAlias: publicNameConsent
            ? displayName
            : "Enterprise Reality Mission Partner",
          namePublic: publicNameConsent,
          role: "mission_partner",
          status: "invited",
          updatedAt: new Date().toISOString(),
        },
      })
      .returning({
        id: members.id,
        displayName: members.displayName,
        publicAlias: members.publicAlias,
        namePublic: members.namePublic,
        role: members.role,
        status: members.status,
      });

    await db
      .insert(missionMemberships)
      .values({
        missionId,
        memberId: member.id,
        canRecord: true,
        canReview: false,
        canPublish: false,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [missionMemberships.missionId, missionMemberships.memberId],
        set: {
          canRecord: true,
          canReview: false,
          canPublish: false,
          status: "active",
        },
      });

    return Response.json({ member }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to add the mission partner." }, { status: 500 });
  }
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

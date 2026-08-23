import { getDb } from "../../../db";
import { fieldRecords } from "../../../db/schema";
import {
  canRecordMission,
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../member-auth";

const sourceKinds = new Set([
  "enterprise_decision_maker",
  "management_consultant",
  "other_practitioner",
]);
const stages = new Set(["signal", "probe"]);
const consentScopes = new Set([
  "internal_only",
  "anonymous_analysis",
  "anonymous_publication",
]);

export async function POST(request: Request) {
  if (!mutationCameFromSameOrigin(request)) {
    return Response.json({ error: "Cross-origin writes are not allowed." }, { status: 403 });
  }

  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in to save a private field record." }, { status: 401 });
  }
  if (!identity.member) {
    return Response.json(
      { error: "Only approved GO Society members can record field evidence." },
      { status: 403 },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const missionId = Number(payload.missionId);
    const organizationAlias = clean(payload.organizationAlias, 80);
    const sourceKind = clean(payload.sourceKind, 40);
    const roleClass = clean(payload.roleClass, 100);
    const privateNotes = clean(payload.privateNotes, 6000);
    const stage = clean(payload.stage ?? "signal", 20);
    const consentScope = clean(payload.consentScope ?? "internal_only", 40);
    const dataMinimized =
      payload.dataMinimized === true || payload.dataMinimized === "on";

    if (
      !Number.isInteger(missionId) ||
      !organizationAlias ||
      !roleClass ||
      !privateNotes ||
      !sourceKinds.has(sourceKind) ||
      !stages.has(stage) ||
      !consentScopes.has(consentScope) ||
      !dataMinimized
    ) {
      return Response.json(
        { error: "Complete the private intake and confirm data minimization." },
        { status: 400 },
      );
    }

    if (!(await canRecordMission(identity.member, missionId))) {
      return Response.json(
        { error: "This member is not authorized to record for that mission." },
        { status: 403 },
      );
    }

    if (
      containsDirectIdentifier(organizationAlias) ||
      containsDirectIdentifier(roleClass) ||
      containsDirectIdentifier(privateNotes)
    ) {
      return Response.json(
        {
          error:
            "Remove direct identifiers such as emails, phone numbers or URLs. Keep follow-up contacts outside GO Society and use aliases here.",
        },
        { status: 400 },
      );
    }

    const db = getDb();
    const [record] = await db
      .insert(fieldRecords)
      .values({
        missionId,
        organizationAlias,
        sourceKind,
        roleClass,
        privateNotes,
        stage,
        consentScope,
        privacyStatus: "private_intake",
        createdByMemberId: identity.member.id,
      })
      .returning({
        id: fieldRecords.id,
        privacyStatus: fieldRecords.privacyStatus,
        createdAt: fieldRecords.createdAt,
      });

    return Response.json({ fieldRecord: record }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Unable to save the private field record." },
      { status: 500 },
    );
  }
}

function clean(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

function containsDirectIdentifier(value: string): boolean {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/;
  const url = /https?:\/\/|www\./i;
  return email.test(value) || phone.test(value) || url.test(value);
}

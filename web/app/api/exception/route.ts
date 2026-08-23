import { getDb } from "../../../db";
import { exceptions } from "../../../db/schema";
import { requireOrganizationalMutation } from "../../../runtime/api-constitutional-guard";
import {
  canRecordMission,
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../member-auth";

export async function POST(request: Request) {
  if (!mutationCameFromSameOrigin(request)) {
    return Response.json({ error: "Cross-origin writes are not allowed." }, { status: 403 });
  }

  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in to raise an exception." }, { status: 401 });
  }
  if (!identity.member) {
    return Response.json({ error: "Only approved members can raise exceptions." }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const missionId = Number(payload.missionId);
    const title = String(payload.title ?? "").trim().slice(0, 140);
    const context = String(payload.context ?? "").trim().slice(0, 4000);
    const requiredDecision = String(payload.requiredDecision ?? "").trim().slice(0, 2000);
    const accountableOwner = String(payload.accountableOwner ?? "").trim().slice(0, 100);
    const severity = String(payload.severity ?? "medium").trim();

    if (!Number.isInteger(missionId) || !title || !context || !requiredDecision || !accountableOwner || !["critical", "high", "medium", "low"].includes(severity)) {
      return Response.json({ error: "Complete the authority exception before escalation." }, { status: 400 });
    }
    if (!(await canRecordMission(identity.member, missionId))) {
      return Response.json({ error: "This member cannot write to that mission." }, { status: 403 });
    }

    const authority = await requireOrganizationalMutation(
      `member:${identity.member.id}`,
      "create_exception",
      `mission:${missionId}`,
    );
    if (!authority.allowed) {
      return Response.json({ error: authority.reason }, { status: 403 });
    }

    const db = getDb();
    const [record] = await db
      .insert(exceptions)
      .values({
        missionId,
        title,
        context,
        requiredDecision,
        accountableOwner,
        severity,
        createdBy: `member:${identity.member.id}`,
      })
      .returning();
    return Response.json({ exception: record }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to raise exception." }, { status: 500 });
  }
}

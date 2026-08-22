import { getDb } from "../../../db";
import { exceptions } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  const actor = await getChatGPTUser();
  if (!actor) return Response.json({ error: "Sign in to raise an exception." }, { status: 401 });

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const missionId = Number(payload.missionId);
    const title = String(payload.title ?? "").trim();
    const context = String(payload.context ?? "").trim();
    const requiredDecision = String(payload.requiredDecision ?? "").trim();
    const accountableOwner = String(payload.accountableOwner ?? "").trim();
    const severity = String(payload.severity ?? "medium").trim();

    if (!Number.isInteger(missionId) || !title || !context || !requiredDecision || !accountableOwner) {
      return Response.json({ error: "Complete the authority exception before escalation." }, { status: 400 });
    }

    const db = getDb();
    const [record] = await db
      .insert(exceptions)
      .values({ missionId, title, context, requiredDecision, accountableOwner, severity, createdBy: actor.displayName })
      .returning();
    return Response.json({ exception: record }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to raise exception." }, { status: 500 });
  }
}

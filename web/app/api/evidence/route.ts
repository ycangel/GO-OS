import { getDb } from "../../../db";
import { evidence } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  const actor = await getChatGPTUser();
  if (!actor) return Response.json({ error: "Sign in to record evidence." }, { status: 401 });

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const missionId = Number(payload.missionId);
    const title = String(payload.title ?? "").trim();
    const observation = String(payload.observation ?? "").trim();
    const source = String(payload.source ?? "").trim();
    const reliability = String(payload.reliability ?? "medium").trim();

    if (!Number.isInteger(missionId) || !title || !observation || !source) {
      return Response.json({ error: "Mission, title, observation and source are required." }, { status: 400 });
    }

    const db = getDb();
    const [record] = await db
      .insert(evidence)
      .values({ missionId, title, observation, source, reliability, createdBy: actor.displayName })
      .returning();
    return Response.json({ evidence: record }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to record evidence." }, { status: 500 });
  }
}

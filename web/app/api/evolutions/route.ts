import { getDb } from "../../../db";
import { evolutionProposals } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  const actor = await getChatGPTUser();
  if (!actor) return Response.json({ error: "Sign in to propose an organizational change." }, { status: 401 });

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const title = String(payload.title ?? "").trim();
    const triggerEvidence = String(payload.triggerEvidence ?? "").trim();
    const proposedChange = String(payload.proposedChange ?? "").trim();
    const sponsor = String(payload.sponsor ?? actor.displayName).trim();
    const reversible = payload.reversible === "on" || payload.reversible === true;

    if (!title || !triggerEvidence || !proposedChange || !sponsor) {
      return Response.json({ error: "A change needs a title, evidence trigger, proposal and named sponsor." }, { status: 400 });
    }

    const db = getDb();
    const [record] = await db
      .insert(evolutionProposals)
      .values({ title, triggerEvidence, proposedChange, sponsor, reversible })
      .returning();
    return Response.json({ evolution: record }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to propose evolution." }, { status: 500 });
  }
}

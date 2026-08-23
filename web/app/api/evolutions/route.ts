import { getDb } from "../../../db";
import { evolutionProposals } from "../../../db/schema";
import {
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../member-auth";

export async function POST(request: Request) {
  if (!mutationCameFromSameOrigin(request)) {
    return Response.json({ error: "Cross-origin writes are not allowed." }, { status: 403 });
  }

  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in to propose an organizational change." }, { status: 401 });
  }
  if (!identity.member?.isOwner) {
    return Response.json(
      { error: "Only the accountable owner can propose an organizational rewrite." },
      { status: 403 },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const title = String(payload.title ?? "").trim().slice(0, 140);
    const triggerEvidence = String(payload.triggerEvidence ?? "").trim().slice(0, 3000);
    const proposedChange = String(payload.proposedChange ?? "").trim().slice(0, 4000);
    const sponsor = String(payload.sponsor ?? identity.member.displayName).trim().slice(0, 100);
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
  } catch {
    return Response.json({ error: "Unable to propose evolution." }, { status: 500 });
  }
}

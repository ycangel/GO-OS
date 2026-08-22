import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  capabilities,
  evidence,
  evolutionProposals,
  exceptions,
  missions,
} from "../../../db/schema";

export const dynamic = "force-dynamic";

function message(error: unknown) {
  const value = error instanceof Error ? error.message : "Unexpected runtime error";
  if (value.includes("no such table")) {
    return "GO Society has not finished initializing its organizational memory.";
  }
  return value;
}

export async function GET() {
  try {
    const db = getDb();
    const [missionRows, evidenceRows, exceptionRows, evolutionRows, capabilityRows] =
      await Promise.all([
        db.select().from(missions).orderBy(missions.id),
        db
          .select({
            id: evidence.id,
            missionId: evidence.missionId,
            missionTitle: missions.title,
            title: evidence.title,
            observation: evidence.observation,
            source: evidence.source,
            freshness: evidence.freshness,
            reliability: evidence.reliability,
            createdBy: evidence.createdBy,
            createdAt: evidence.createdAt,
          })
          .from(evidence)
          .leftJoin(missions, eq(evidence.missionId, missions.id))
          .orderBy(desc(evidence.createdAt), desc(evidence.id))
          .limit(60),
        db
          .select({
            id: exceptions.id,
            missionId: exceptions.missionId,
            missionTitle: missions.title,
            title: exceptions.title,
            context: exceptions.context,
            severity: exceptions.severity,
            requiredDecision: exceptions.requiredDecision,
            accountableOwner: exceptions.accountableOwner,
            status: exceptions.status,
            createdAt: exceptions.createdAt,
          })
          .from(exceptions)
          .leftJoin(missions, eq(exceptions.missionId, missions.id))
          .orderBy(desc(exceptions.createdAt), desc(exceptions.id))
          .limit(30),
        db
          .select()
          .from(evolutionProposals)
          .orderBy(desc(evolutionProposals.createdAt), desc(evolutionProposals.id))
          .limit(30),
        db.select().from(capabilities).orderBy(desc(capabilities.evidenceCount), capabilities.name),
      ]);

    return Response.json(
      {
        missions: missionRows,
        evidence: evidenceRows,
        exceptions: exceptionRows,
        evolutions: evolutionRows,
        capabilities: capabilityRows,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: message(error) }, { status: 500 });
  }
}

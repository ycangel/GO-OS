import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { capabilities, missions, publicCases } from "../../../db/schema";

export const dynamic = "force-dynamic";

function message(error: unknown) {
  const value = error instanceof Error ? error.message : "Unexpected runtime error";
  if (value.includes("no such table")) {
    return "GO Society has not finished initializing its organizational memory.";
  }
  return "The public runtime is temporarily unavailable.";
}

export async function GET() {
  try {
    const db = getDb();
    const [missionRows, caseRows, capabilityRows] = await Promise.all([
      db
        .select({
          id: missions.id,
          slug: missions.slug,
          title: missions.title,
          purpose: missions.purpose,
          owner: missions.publicOwnerLabel,
          status: missions.status,
          authoritySummary: missions.authoritySummary,
          successSignal: missions.successSignal,
          nextDecision: missions.nextDecision,
          confidence: missions.confidence,
          updatedAt: missions.updatedAt,
        })
        .from(missions)
        .orderBy(missions.id),
      db
        .select({
          id: publicCases.id,
          missionId: publicCases.missionId,
          missionTitle: missions.title,
          title: publicCases.publicTitle,
          summary: publicCases.publicSummary,
          organizationProfile: publicCases.organizationProfile,
          sourceRoleClass: publicCases.sourceRoleClass,
          stage: publicCases.stage,
          consentScope: publicCases.consentScope,
          reidentificationRisk: publicCases.reidentificationRisk,
          privacyStatus: publicCases.privacyStatus,
          publishedAt: publicCases.publishedAt,
        })
        .from(publicCases)
        .leftJoin(missions, eq(publicCases.missionId, missions.id))
        .where(
          and(
            eq(publicCases.publicationStatus, "published"),
            eq(publicCases.privacyStatus, "human_approved"),
            eq(publicCases.reidentificationRisk, "low"),
            eq(publicCases.consentScope, "anonymous_publication"),
            isNotNull(publicCases.approvedByMemberId),
            isNotNull(publicCases.approvedAt),
            isNotNull(publicCases.publishedAt),
          ),
        )
        .orderBy(desc(publicCases.publishedAt), desc(publicCases.id))
        .limit(60),
      db
        .select({
          id: capabilities.id,
          name: capabilities.name,
          maturity: capabilities.maturity,
          evidenceCount: capabilities.evidenceCount,
          lastLearnedAt: capabilities.lastLearnedAt,
        })
        .from(capabilities)
        .orderBy(desc(capabilities.evidenceCount), capabilities.name),
    ]);

    return Response.json(
      {
        missions: missionRows,
        evidence: caseRows,
        exceptions: [],
        evolutions: [],
        capabilities: capabilityRows,
        privacyMode: "public_deidentified",
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: message(error) }, { status: 500 });
  }
}

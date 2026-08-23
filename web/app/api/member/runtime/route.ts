import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  capabilities,
  evolutionProposals,
  exceptions,
  fieldRecords,
  members,
  missionMemberships,
  missions,
  publicCases,
} from "../../../../db/schema";
import { getRuntimeIdentity } from "../../../member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in to access the member runtime." }, { status: 401 });
  }
  if (!identity.member) {
    return Response.json(
      { error: "This account is not an approved GO Society member." },
      { status: 403 },
    );
  }

  try {
    const db = getDb();
    const membershipRows = identity.member.isOwner
      ? []
      : await db
          .select({
            missionId: missionMemberships.missionId,
            canReview: missionMemberships.canReview,
          })
          .from(missionMemberships)
          .where(
            and(
              eq(missionMemberships.memberId, identity.member.id),
              eq(missionMemberships.status, "active"),
            ),
          );
    const missionIds = membershipRows.map((row) => row.missionId);
    const reviewMissionIds = membershipRows
      .filter((row) => row.canReview)
      .map((row) => row.missionId);

    const missionProjection = {
      id: missions.id,
      slug: missions.slug,
      title: missions.title,
      purpose: missions.purpose,
      status: missions.status,
      authoritySummary: missions.authoritySummary,
      successSignal: missions.successSignal,
      nextDecision: missions.nextDecision,
      confidence: missions.confidence,
      updatedAt: missions.updatedAt,
    };
    const missionRows = identity.member.isOwner
      ? await db
          .select({ ...missionProjection, owner: missions.owner })
          .from(missions)
          .orderBy(missions.id)
      : missionIds.length
        ? await db
            .select({ ...missionProjection, owner: missions.publicOwnerLabel })
            .from(missions)
            .where(inArray(missions.id, missionIds))
            .orderBy(missions.id)
        : [];
    const caseRows = await db
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
      .limit(60);

    const exceptionRows =
      identity.member.isOwner || missionIds.length
        ? await db
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
            .where(
              identity.member.isOwner
                ? undefined
                : and(
                    inArray(exceptions.missionId, missionIds),
                    reviewMissionIds.length
                      ? or(
                          eq(exceptions.createdBy, `member:${identity.member.id}`),
                          inArray(exceptions.missionId, reviewMissionIds),
                        )
                      : eq(exceptions.createdBy, `member:${identity.member.id}`),
                  ),
            )
            .orderBy(desc(exceptions.createdAt), desc(exceptions.id))
            .limit(30)
        : [];

    const evolutionRows = identity.member.isOwner
      ? await db
          .select()
          .from(evolutionProposals)
          .orderBy(desc(evolutionProposals.createdAt), desc(evolutionProposals.id))
          .limit(30)
      : [];

    const capabilityRows = await db
      .select()
      .from(capabilities)
      .orderBy(desc(capabilities.evidenceCount), capabilities.name);

    const fieldRows = await db
            .select({
              id: fieldRecords.id,
              missionId: fieldRecords.missionId,
              missionTitle: missions.title,
              organizationAlias: fieldRecords.organizationAlias,
              sourceKind: fieldRecords.sourceKind,
              roleClass: fieldRecords.roleClass,
              privateNotes: fieldRecords.privateNotes,
              stage: fieldRecords.stage,
              consentScope: fieldRecords.consentScope,
              privacyStatus: fieldRecords.privacyStatus,
              createdAt: fieldRecords.createdAt,
            })
            .from(fieldRecords)
            .leftJoin(missions, eq(fieldRecords.missionId, missions.id))
            .where(
              identity.member.isOwner
                ? undefined
                : and(
                    inArray(fieldRecords.missionId, missionIds),
                    reviewMissionIds.length
                      ? or(
                          eq(fieldRecords.createdByMemberId, identity.member.id),
                          inArray(fieldRecords.missionId, reviewMissionIds),
                        )
                      : eq(fieldRecords.createdByMemberId, identity.member.id),
                  ),
            )
            .orderBy(desc(fieldRecords.createdAt), desc(fieldRecords.id))
            .limit(100);

    const teamRows = await db
      .select({
        id: members.id,
        displayName: members.displayName,
        publicAlias: members.publicAlias,
        namePublic: members.namePublic,
        role: members.role,
        status: members.status,
        missionId: missionMemberships.missionId,
        missionTitle: missions.title,
        canRecord: missionMemberships.canRecord,
        canReview: missionMemberships.canReview,
        canPublish: missionMemberships.canPublish,
      })
      .from(members)
      .leftJoin(
        missionMemberships,
        eq(members.id, missionMemberships.memberId),
      )
      .leftJoin(missions, eq(missionMemberships.missionId, missions.id))
      .where(
        identity.member.isOwner
          ? undefined
          : eq(members.id, identity.member.id),
      )
      .orderBy(members.id);

    return Response.json(
      {
        missions: missionRows,
        evidence: caseRows,
        exceptions: exceptionRows,
        evolutions: evolutionRows,
        capabilities: capabilityRows,
        fieldRecords: fieldRows,
        team: teamRows.map((row) => ({
          ...row,
          displayName:
            identity.member?.isOwner || row.id === identity.member?.id
              ? row.displayName
              : row.publicAlias,
        })),
        privacyMode: "authorized_member",
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "The member runtime is temporarily unavailable." },
      { status: 500 },
    );
  }
}

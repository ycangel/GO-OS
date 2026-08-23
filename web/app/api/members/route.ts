import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { members, missions } from "../../../db/schema";
import { requireOrganizationalMutation } from "../../../runtime/api-constitutional-guard";
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
    const [mission] = await db
      .select({ id: missions.id })
      .from(missions)
      .where(eq(missions.id, missionId))
      .limit(1);
    if (!mission) {
      return Response.json({ error: "The selected mission does not exist." }, { status: 400 });
    }

    const authority = await requireOrganizationalMutation(
      `member:${identity.member.id}`,
      "custom:manage_membership",
      `mission:${missionId}`,
    );
    if (!authority.allowed) {
      return Response.json({ error: authority.reason }, { status: 403 });
    }

    const publicAlias = publicNameConsent
      ? displayName
      : "Enterprise Reality Mission Partner";
    const now = new Date().toISOString();
    const d1 = env.DB;

    // D1 batch is the atomic boundary: the member, mission assignment and
    // AuthorityGrant either all persist or all roll back.
    await d1.batch([
      d1
        .prepare(`
          INSERT INTO members (
            email, display_name, public_alias, name_public, role, status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'mission_partner', 'invited', ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            display_name = excluded.display_name,
            public_alias = excluded.public_alias,
            name_public = excluded.name_public,
            role = 'mission_partner',
            status = CASE
              WHEN members.status = 'active' THEN 'active'
              ELSE 'invited'
            END,
            expires_at = NULL,
            updated_at = excluded.updated_at
        `)
        .bind(email, displayName, publicAlias, publicNameConsent ? 1 : 0, now, now),
      d1
        .prepare(`
          INSERT INTO mission_memberships (
            mission_id, member_id, can_record, can_review, can_publish, status
          )
          SELECT ?, id, 1, 0, 0, 'active'
          FROM members
          WHERE email = ?
          ON CONFLICT(mission_id, member_id) DO UPDATE SET
            can_record = 1,
            can_review = 0,
            can_publish = 0,
            status = 'active'
        `)
        .bind(missionId, email),
      d1
        .prepare(`
          INSERT INTO authority_grants (
            id, grantor, grantee, accountable_human, scope,
            allowed_actions, prohibited_actions, resource_rights, limits,
            reversibility_ceiling, evidence_obligations, escalation,
            conflict_rules, valid_from, expires_at, revoked_at,
            self_expansion_allowed
          )
          SELECT
            'authority-member-' || id || '-v050',
            ?,
            'member:' || id,
            ?,
            'Record bounded field evidence and raise exceptions for assigned missions.',
            ?, ?, ?, ?, 'reversible_only', ?, ?, ?, ?, expires_at, NULL, 0
          FROM members
          WHERE email = ?
          ON CONFLICT(id) DO UPDATE SET
            grantor = excluded.grantor,
            accountable_human = excluded.accountable_human,
            scope = excluded.scope,
            allowed_actions = excluded.allowed_actions,
            prohibited_actions = excluded.prohibited_actions,
            resource_rights = excluded.resource_rights,
            limits = excluded.limits,
            reversibility_ceiling = excluded.reversibility_ceiling,
            evidence_obligations = excluded.evidence_obligations,
            escalation = excluded.escalation,
            conflict_rules = excluded.conflict_rules,
            valid_from = excluded.valid_from,
            expires_at = excluded.expires_at,
            revoked_at = NULL,
            self_expansion_allowed = 0
        `)
        .bind(
          `member:${identity.member.id}`,
          identity.member.displayName,
          JSON.stringify(["create_evidence", "create_exception"]),
          JSON.stringify([
            "custom:expand_own_authority",
            "custom:modify_own_authority",
            "create_evolution_proposal",
            "update_mission",
          ]),
          JSON.stringify({
            missionMembershipRequired: true,
            allowedTargetPrefixes: ["mission:"],
          }),
          JSON.stringify({
            maxRiskClass: "low",
            maxResourceExposure: 1,
            allowedTools: ["web-runtime"],
          }),
          JSON.stringify([
            "Minimize private data and preserve the source and consent scope.",
          ]),
          JSON.stringify([
            "Escalate publication, authority changes and any action outside the assigned mission.",
          ]),
          JSON.stringify([
            "Multiple active grants fail closed until an explicit conflict-resolution rule is implemented.",
          ]),
          now,
          email,
        ),
    ]);

    const [member] = await db
      .select({
        id: members.id,
        displayName: members.displayName,
        publicAlias: members.publicAlias,
        namePublic: members.namePublic,
        role: members.role,
        status: members.status,
      })
      .from(members)
      .where(eq(members.email, email))
      .limit(1);
    if (!member) throw new Error("Atomic member invitation did not persist.");

    return Response.json({ member }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to add the mission partner." }, { status: 500 });
  }
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

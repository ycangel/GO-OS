import { getRuntimeIdentity } from "../../../member-auth";
import {
  getWebMcpPrincipalLink,
  listMcpDraftsForMember,
  McpBridgeServiceError,
} from "../../../../runtime/mcp-bridge-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json(
      { error: "Sign in to view the conversation bridge inbox." },
      { status: 401 },
    );
  }
  if (!identity.member) {
    return Response.json(
      { error: "Only approved GO Society members can view MCP drafts." },
      { status: 403 },
    );
  }

  try {
    const [link, drafts] = await Promise.all([
      getWebMcpPrincipalLink(identity.member, identity.user.id, request.url),
      listMcpDraftsForMember(identity.member),
    ]);
    return Response.json(
      {
        contractVersion: "0.5.0-alpha.2",
        bridge: {
          linked: Boolean(link),
          linkedAt: link?.linkedAt ?? null,
          revocable: true,
          identityBoundary: "sites_stable_user_id_hmac",
        },
        drafts: drafts.map((draft) => ({
          id: draft.id,
          missionId: draft.missionId,
          sourceInterface: draft.sourceInterface,
          sourceTitle: draft.sourceTitle,
          expectedCursor: draft.expectedCursor,
          payload: draft.stagedPayload,
          payloadHash: draft.payloadHash,
          status: draft.status,
          reviewRequestedAt: draft.reviewRequestedAt,
          confirmedCheckpointReceiptId: draft.confirmedCheckpointReceiptId,
          expiresAt: draft.expiresAt,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          boundary: {
            provenanceTrust: "model_reported",
            canonicalCognitionCreated: draft.status === "confirmed",
            headChanged: false,
          },
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

function serviceErrorResponse(error: unknown) {
  if (error instanceof McpBridgeServiceError) {
    return Response.json(
      { code: error.code, error: error.message, ...error.details },
      { status: error.status },
    );
  }
  return Response.json(
    { error: "The private conversation bridge inbox is unavailable." },
    { status: 500 },
  );
}

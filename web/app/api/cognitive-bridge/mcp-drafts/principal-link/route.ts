import {
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../../../member-auth";
import {
  getWebMcpPrincipalLink,
  linkWebMcpPrincipal,
  McpBridgeServiceError,
  revokeWebMcpPrincipal,
} from "../../../../../runtime/mcp-bridge-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in before linking the conversation bridge." }, { status: 401 });
  }
  if (!identity.member) {
    return Response.json({ error: "Only approved GO Society members can link the bridge." }, { status: 403 });
  }
  try {
    const link = await getWebMcpPrincipalLink(
      identity.member,
      identity.user.principalKey,
      request.url,
    );
    return Response.json(
      { linked: Boolean(link), linkedAt: link?.linkedAt ?? null },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authorized = await requireSameOriginMember(request);
  if (authorized instanceof Response) return authorized;
  try {
    const link = await linkWebMcpPrincipal(
      authorized,
      authorized.principalKey,
      request.url,
    );
    return Response.json(
      { linked: true, linkedAt: link.linkedAt },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const authorized = await requireSameOriginMember(request);
  if (authorized instanceof Response) return authorized;
  try {
    const revoked = await revokeWebMcpPrincipal(
      authorized,
      authorized.principalKey,
      request.url,
    );
    return Response.json(
      { linked: false, revoked },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

async function requireSameOriginMember(request: Request) {
  if (!mutationCameFromSameOrigin(request)) {
    return Response.json({ error: "Cross-origin writes are not allowed." }, { status: 403 });
  }
  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in before linking the conversation bridge." }, { status: 401 });
  }
  if (!identity.member) {
    return Response.json({ error: "Only approved GO Society members can link the bridge." }, { status: 403 });
  }
  return { ...identity.member, principalKey: identity.user.principalKey };
}

function serviceErrorResponse(error: unknown) {
  if (error instanceof McpBridgeServiceError) {
    return Response.json(
      { code: error.code, error: error.message, ...error.details },
      { status: error.status },
    );
  }
  return Response.json({ error: "Unable to change the conversation bridge link." }, { status: 500 });
}

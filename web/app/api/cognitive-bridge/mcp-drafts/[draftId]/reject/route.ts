import { z } from "zod";
import {
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../../../../member-auth";
import {
  McpBridgeServiceError,
  rejectMcpDraftForMember,
} from "../../../../../../runtime/mcp-bridge-service";

const rejectionSchema = z.object({
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  if (!mutationCameFromSameOrigin(request)) {
    return Response.json({ error: "Cross-origin writes are not allowed." }, { status: 403 });
  }
  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json({ error: "Sign in before rejecting MCP cognition." }, { status: 401 });
  }
  if (!identity.member) {
    return Response.json({ error: "Only approved GO Society members can reject MCP cognition." }, { status: 403 });
  }

  try {
    const body = rejectionSchema.parse(await request.json());
    const { draftId } = await params;
    const draft = await rejectMcpDraftForMember(
      identity.member,
      draftId,
      body.payloadHash,
    );
    return Response.json(
      {
        draft: { id: draft.id, status: "rejected", payloadHash: draft.payloadHash },
        boundary: { canonicalCognitionCreated: false, headChanged: false },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

function serviceErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: error.issues[0]?.message ?? "The rejection hash is invalid." },
      { status: 400 },
    );
  }
  if (error instanceof McpBridgeServiceError) {
    return Response.json(
      { code: error.code, error: error.message, ...error.details },
      { status: error.status },
    );
  }
  return Response.json({ error: "Unable to reject this MCP draft." }, { status: 500 });
}

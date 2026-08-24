import { z } from "zod";
import {
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../../../../member-auth";
import { persistHumanConfirmedCheckpoint } from "../../../checkpoints/route";
import {
  markMcpDraftConfirmed,
  McpBridgeServiceError,
  prepareMcpDraftConfirmation,
  releaseMcpDraftConfirmation,
} from "../../../../../../runtime/mcp-bridge-service";

const confirmationSchema = z.object({
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
    return Response.json({ error: "Sign in before confirming MCP cognition." }, { status: 401 });
  }
  if (!identity.member) {
    return Response.json({ error: "Only approved GO Society members can confirm MCP cognition." }, { status: 403 });
  }

  try {
    const body = confirmationSchema.parse(await request.json());
    const { draftId } = await params;
    const prepared = await prepareMcpDraftConfirmation(
      identity.member,
      draftId,
      body.payloadHash,
    );
    const checkpointResponse = await persistHumanConfirmedCheckpoint(
      request,
      prepared.checkpoint,
    );
    const checkpointPayload = (await checkpointResponse.json()) as {
      checkpoint?: { id?: string };
      error?: string;
      code?: string;
    };
    if (!checkpointResponse.ok || !checkpointPayload.checkpoint?.id) {
      if (!checkpointResponse.ok && checkpointResponse.status < 500) {
        await releaseMcpDraftConfirmation(
          prepared.draft.id,
          prepared.draft.payloadHash,
        );
      }
      return Response.json(checkpointPayload, {
        status: checkpointResponse.status,
        headers: { "cache-control": "no-store" },
      });
    }
    await markMcpDraftConfirmed(
      prepared.draft.id,
      prepared.draft.payloadHash,
      checkpointPayload.checkpoint.id,
    );
    return Response.json(
      {
        contractVersion: "0.5.0-alpha.2",
        draft: {
          id: prepared.draft.id,
          status: "confirmed",
          payloadHash: prepared.draft.payloadHash,
        },
        checkpoint: checkpointPayload.checkpoint,
        boundary: {
          consent: "user_confirmed",
          candidateCreated: true,
          headChanged: false,
          ratificationStillRequired: true,
        },
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

function serviceErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: error.issues[0]?.message ?? "The confirmation hash is invalid." },
      { status: 400 },
    );
  }
  if (error instanceof McpBridgeServiceError) {
    return Response.json(
      { code: error.code, error: error.message, ...error.details },
      { status: error.status },
    );
  }
  return Response.json({ error: "Unable to confirm this MCP draft." }, { status: 500 });
}

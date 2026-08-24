import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  ErrorCode,
  McpError,
  type ServerResult,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import cognitiveBridgeSkillMarkdown from "./assets/go-society-cognitive-bridge.skill.md?raw";
import {
  getMcpCognitiveContext,
  requestMcpHumanReview,
  stageMcpCheckpoint,
} from "./mcp-bridge-service";

const MCP_SERVER_NAME = "go-society-cognitive-bridge";
const MCP_SERVER_VERSION = "0.5.0";
const MCP_MAX_REQUEST_BYTES = 160_000;
const MCP_MAX_CONCURRENT_REQUESTS = 8;
const MCP_RATE_WINDOW_MS = 60_000;
const MCP_MAX_REQUESTS_PER_SOURCE_WINDOW = 120;
const MCP_MAX_RATE_SOURCES = 2_048;
const SKILL_URI =
  "skill://go-society/go-society-cognitive-bridge/SKILL.md";

let activeMcpRequests = 0;
const mcpRateWindows = new Map<
  string,
  { startedAt: number; requestCount: number }
>();

// Deployment invariant: this vendored UTF-8 file must byte-match the canonical
// `skills/go-society-cognitive-bridge/SKILL.md`. It lives inside the Sites
// project root so the production source bundle never depends on a parent path.
export const MCP_SKILL_CANONICAL_REPO_PATH =
  "skills/go-society-cognitive-bridge/SKILL.md";
export const MCP_SKILL_VENDORED_WEB_PATH =
  "web/runtime/assets/go-society-cognitive-bridge.skill.md";

const OPENAI_BROWSER_ORIGINS = new Set([
  "https://chat.openai.com",
  "https://chatgpt.com",
  "https://codex.openai.com",
]);

const CORS_REQUEST_HEADERS = new Set([
  "accept",
  "authorization",
  "content-type",
  "mcp-method",
  "mcp-name",
  "mcp-protocol-version",
  "mcp-session-id",
]);

const dateTime = z
  .string()
  .max(48)
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid date-time");

const getContextInputSchema = z
  .object({
    missionId: z.number().int().positive().optional(),
    source: z
      .object({
        interface: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .regex(/^[a-z0-9][a-z0-9_.:-]*$/),
        threadKey: z.string().trim().min(1).max(240),
      })
      .strict()
      .optional(),
  })
  .strict();

const sourceSchema = z
  .object({
    interface: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9][a-z0-9_.:-]*$/),
    threadKey: z.string().trim().min(1).max(240),
    title: z.string().trim().min(1).max(180),
    captureMode: z.literal("selected_checkpoint").optional(),
  })
  .strict();

const fragmentSchema = z
  .object({
    clientRef: z.string().trim().min(1).max(80),
    sourceTurnRef: z.string().trim().min(1).max(180),
    speakerType: z.enum(["human", "agent"]),
    speakerRef: z.string().trim().max(120).optional(),
    verbatimText: z.string().min(1).max(12_000),
    contentKind: z.enum([
      "narrative",
      "principle",
      "claim",
      "evidence",
      "decision",
      "question",
    ]),
    occurredAt: dateTime.optional(),
  })
  .strict();

const candidateSchema = z
  .object({
    clientRef: z.string().trim().min(1).max(80),
    objectType: z.enum([
      "CognitiveEvent",
      "DeliberationSession",
      "LearningRecord",
      "EvolutionProposal",
    ]),
    payload: z.record(z.string(), z.unknown()),
    sourceFragmentRefs: z
      .array(z.string().trim().min(1).max(80))
      .max(24)
      .optional(),
  })
  .strict();

const stageCheckpointInputSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(180),
    missionId: z.number().int().positive(),
    expectedCursor: z.number().int().nonnegative(),
    source: sourceSchema,
    fragments: z.array(fragmentSchema).min(1).max(24),
    candidates: z.array(candidateSchema).min(1).max(12),
  })
  .strict();

const requestHumanReviewInputSchema = z
  .object({
    draftId: z.string().trim().regex(/^mcpd_[a-f0-9-]{16,}$/),
    payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const toolSuccessOutputSchema = {
  ok: z.literal(true),
  data: z.record(z.string(), z.unknown()),
};

const skillsListRequestSchema = z.object({
  method: z.literal("skills/list"),
  params: z
    .object({
      cursor: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

const skillsGetRequestSchema = z.object({
  method: z.literal("skills/get"),
  params: z.object({
    uri: z.string(),
  }),
});

export type McpGetContextInput = z.infer<typeof getContextInputSchema>;
export type McpStageCheckpointInput = z.infer<
  typeof stageCheckpointInputSchema
>;
export type McpRequestHumanReviewInput = z.infer<
  typeof requestHumanReviewInputSchema
>;

export interface McpBridgeRequestContext {
  headers: Headers;
  origin: string;
  requestUrl: string;
}

type JsonRecord = Record<string, unknown>;

type SkillEntry = {
  uri: string;
  frontmatter: JsonRecord;
  resources: Array<{ uri: string; digest: string }>;
};

type ServiceError = Error & {
  code: string;
  status: number;
  wwwAuthenticate?: string | string[];
};

const contextSecuritySchemes = [
  { type: "oauth2", scopes: ["go.context.read"] },
];
const checkpointSecuritySchemes = [
  { type: "oauth2", scopes: ["go.checkpoint.write"] },
];

export async function handleMcpPost(request: Request): Promise<Response> {
  const corsOrigin = allowedCorsOrigin(request);
  const rateLimit = consumeMcpRateLimit(request);
  if (!rateLimit.allowed) {
    return withCors(
      jsonRpcErrorResponse(
        429,
        -32002,
        "The GO Society MCP request rate is temporarily limited.",
        { "retry-after": String(rateLimit.retryAfterSeconds) },
      ),
      corsOrigin,
    );
  }
  if (activeMcpRequests >= MCP_MAX_CONCURRENT_REQUESTS) {
    return withCors(
      jsonRpcErrorResponse(
        503,
        -32003,
        "The GO Society MCP endpoint is at its bounded concurrency limit.",
        { "retry-after": "1" },
      ),
      corsOrigin,
    );
  }

  activeMcpRequests += 1;
  try {
    return await handleBoundedMcpPost(request, corsOrigin);
  } finally {
    activeMcpRequests -= 1;
  }
}

async function handleBoundedMcpPost(
  request: Request,
  corsOrigin: string | null,
): Promise<Response> {
  if (request.headers.has("origin") && !corsOrigin) {
    return jsonRpcErrorResponse(
      403,
      -32000,
      "This browser origin is not allowed to call the GO Society MCP endpoint.",
    );
  }

  if (new URL(request.url).searchParams.has("access_token")) {
    return withCors(
      jsonRpcErrorResponse(
        400,
        -32600,
        "Bearer credentials are not accepted in the request URL.",
      ),
      corsOrigin,
    );
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return withCors(
      jsonRpcErrorResponse(
        415,
        -32600,
        "The MCP endpoint accepts application/json requests only.",
      ),
      corsOrigin,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MCP_MAX_REQUEST_BYTES
  ) {
    return withCors(
      jsonRpcErrorResponse(
        413,
        -32001,
        "The MCP request exceeds the private intake limit.",
      ),
      corsOrigin,
    );
  }

  let parsedBody: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MCP_MAX_REQUEST_BYTES) {
      return withCors(
        jsonRpcErrorResponse(
          413,
          -32001,
          "The MCP request exceeds the private intake limit.",
        ),
        corsOrigin,
      );
    }
    parsedBody = JSON.parse(body);
  } catch {
    return withCors(
      jsonRpcErrorResponse(400, -32700, "The MCP request is not valid JSON."),
      corsOrigin,
    );
  }
  if (Array.isArray(parsedBody)) {
    return withCors(
      jsonRpcErrorResponse(
        400,
        -32600,
        "JSON-RPC batch requests are not supported by this bounded bridge.",
      ),
      corsOrigin,
    );
  }

  const requestUrl = new URL(request.url);
  const requestContext: McpBridgeRequestContext = {
    headers: new Headers(request.headers),
    origin: requestUrl.origin,
    requestUrl: requestUrl.toString(),
  };
  const server = createGoSocietyMcpServer(requestContext);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request, { parsedBody });
    const securedResponse = await exposeTopLevelToolSecuritySchemes(
      parsedBody,
      response,
    );
    return withCors(securedResponse, corsOrigin);
  } catch {
    return withCors(
      jsonRpcErrorResponse(
        500,
        -32603,
        "The GO Society MCP endpoint could not process this request.",
      ),
      corsOrigin,
    );
  }
}

function consumeMcpRateLimit(request: Request): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  if (mcpRateWindows.size >= MCP_MAX_RATE_SOURCES) {
    for (const [key, window] of mcpRateWindows) {
      if (now - window.startedAt >= MCP_RATE_WINDOW_MS) {
        mcpRateWindows.delete(key);
      }
    }
  }

  const source = mcpRequestSource(request);
  const key =
    mcpRateWindows.has(source) || mcpRateWindows.size < MCP_MAX_RATE_SOURCES
      ? source
      : "overflow";
  const current = mcpRateWindows.get(key);
  if (!current || now - current.startedAt >= MCP_RATE_WINDOW_MS) {
    mcpRateWindows.set(key, { startedAt: now, requestCount: 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.requestCount >= MCP_MAX_REQUESTS_PER_SOURCE_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (MCP_RATE_WINDOW_MS - (now - current.startedAt)) / 1_000,
        ),
      ),
    };
  }
  current.requestCount += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function mcpRequestSource(request: Request): string {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .at(-1);
  if (forwarded && forwarded.length <= 128) return forwarded;

  const connecting = request.headers.get("cf-connecting-ip")?.trim();
  if (connecting && connecting.length <= 128) return connecting;
  return "direct";
}

export function handleMcpOptions(request: Request): Response {
  const corsOrigin = allowedCorsOrigin(request);
  if (!corsOrigin) {
    return jsonRpcErrorResponse(
      403,
      -32000,
      "This browser origin is not allowed to call the GO Society MCP endpoint.",
    );
  }

  const requestedMethod =
    request.headers.get("access-control-request-method")?.toUpperCase() ?? "";
  if (requestedMethod !== "POST") {
    return withCors(
      jsonRpcErrorResponse(
        405,
        -32000,
        "CORS preflight is available for POST only.",
        { Allow: "POST, OPTIONS" },
      ),
      corsOrigin,
    );
  }

  const requestedHeaders = (request.headers.get(
    "access-control-request-headers",
  ) ?? "")
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);
  const deniedHeader = requestedHeaders.find(
    (header) => !CORS_REQUEST_HEADERS.has(header),
  );
  if (deniedHeader) {
    return withCors(
      jsonRpcErrorResponse(
        403,
        -32000,
        `CORS request header is not allowed: ${deniedHeader}`,
      ),
      corsOrigin,
    );
  }

  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-headers": [...CORS_REQUEST_HEADERS].join(", "),
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-origin": corsOrigin,
      "access-control-max-age": "600",
      "cache-control": "no-store",
      vary: "Origin, Access-Control-Request-Headers",
    },
  });
}

export function mcpMethodNotAllowed(request: Request): Response {
  return withCors(
    jsonRpcErrorResponse(405, -32000, "Method not allowed.", {
      Allow: "POST, OPTIONS",
    }),
    allowedCorsOrigin(request),
  );
}

function createGoSocietyMcpServer(
  requestContext: McpBridgeRequestContext,
): McpServer {
  const server = new McpServer(
    {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
    {
      capabilities: {
        extensions: {
          "io.modelcontextprotocol/skills": {},
        },
      },
      instructions:
        "GO Society is candidate-only from a conversation. Load compact ratified context at the start of relevant work. Stage only user-selected, internal-only material after explicit consent; staging never changes the cognitive head. Human review and ratification remain in the GO Society Web Human Gate. Never claim approval, commit, version, Mission mutation, or head advancement from these tools.",
    },
  );

  server.registerTool(
    "go_society_get_context",
    {
      title: "Load GO Society cognitive context",
      description:
        "Load compact, ratified organizational cognition and unresolved questions for an authorized GO Society Mission. Use at the start of a relevant conversation and after a reported Web decision. This read never returns private drafts or advances the cognitive head.",
      inputSchema: getContextInputSchema,
      outputSchema: toolSuccessOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      // The SDK preserves the compatibility mirror here. The transport
      // response decorator below also emits OpenAI's required top-level field.
      _meta: { securitySchemes: contextSecuritySchemes },
    },
    async (input) =>
      callServiceTool(
        "GO Society ratified context loaded.",
        () => getMcpCognitiveContext(input, requestContext),
      ),
  );

  server.registerTool(
    "go_society_stage_checkpoint",
    {
      title: "Stage a GO Society cognitive checkpoint",
      description:
        "Stage a bounded, private, candidate-only draft from material the member explicitly selected and approved for internal-only processing. System messages, consent self-claims and user-confirmed provenance are not accepted. This operation does not create canonical cognition, commit a version, or advance the cognitive head.",
      inputSchema: stageCheckpointInputSchema,
      outputSchema: toolSuccessOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: { securitySchemes: checkpointSecuritySchemes },
    },
    async (input) =>
      callServiceTool(
        "Candidate-only checkpoint draft staged. The cognitive head did not change.",
        () => stageMcpCheckpoint(input, requestContext),
      ),
  );

  server.registerTool(
    "go_society_request_human_review",
    {
      title: "Request GO Society human review",
      description:
        "Send an existing staged draft to the private GO Society Web Human Gate using its exact payload hash. This requests review only. It cannot approve, ratify, commit, version, mutate a Mission, or advance the cognitive head.",
      inputSchema: requestHumanReviewInputSchema,
      outputSchema: toolSuccessOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: { securitySchemes: checkpointSecuritySchemes },
    },
    async (input) =>
      callServiceTool(
        "Human review requested in GO Society Web. No approval has occurred.",
        () => requestMcpHumanReview(input, requestContext),
      ),
  );

  server.registerResource(
    "go-society-cognitive-bridge-skill",
    SKILL_URI,
    {
      title: "GO Society Cognitive Bridge Skill",
      description:
        "Candidate-only operating instructions for connecting a conversation to GO Society cognition.",
      mimeType: "text/markdown; charset=utf-8",
    },
    async () => ({
      contents: [
        {
          uri: SKILL_URI,
          mimeType: "text/markdown; charset=utf-8",
          text: cognitiveBridgeSkillMarkdown,
        },
      ],
    }),
  );

  server.server.fallbackRequestHandler = async (request) => {
    if (request.method === "skills/list") {
      const parsed = skillsListRequestSchema.safeParse(request);
      if (!parsed.success) {
        throw new McpError(ErrorCode.InvalidParams, "Invalid skills/list request.");
      }
      if (parsed.data.params?.cursor) {
        throw new McpError(ErrorCode.InvalidParams, "Unknown skills cursor.");
      }
      return {
        skills: [await cognitiveBridgeSkillEntry()],
      } as unknown as ServerResult;
    }

    if (request.method === "skills/get") {
      const parsed = skillsGetRequestSchema.safeParse(request);
      if (!parsed.success || parsed.data.params.uri !== SKILL_URI) {
        throw new McpError(ErrorCode.InvalidParams, "Unknown skill URI.");
      }
      return {
        skill: await cognitiveBridgeSkillEntry(),
      } as unknown as ServerResult;
    }

    throw new McpError(ErrorCode.MethodNotFound, "Method not found.");
  };

  return server;
}

async function callServiceTool(
  successMessage: string,
  operation: () => Promise<unknown>,
) {
  try {
    const data = asJsonRecord(await operation());
    return {
      content: [{ type: "text" as const, text: successMessage }],
      structuredContent: { ok: true as const, data },
    };
  } catch (error) {
    const serviceError = asServiceError(error);
    const structuredContent = {
      ok: false,
      error: {
        code: serviceError?.code ?? "INTERNAL_ERROR",
        message:
          serviceError?.message ??
          "GO Society could not complete this tool operation.",
        status: serviceError?.status ?? 500,
      },
    };
    const challenges = serviceError
      ? asAuthenticationChallenges(serviceError.wwwAuthenticate)
      : [];
    return {
      content: [
        {
          type: "text" as const,
          text: structuredContent.error.message,
        },
      ],
      structuredContent,
      ...(challenges.length
        ? { _meta: { "mcp/www_authenticate": challenges } }
        : {}),
      isError: true,
    };
  }
}

async function cognitiveBridgeSkillEntry(): Promise<SkillEntry> {
  return {
    uri: SKILL_URI,
    frontmatter: parseSkillFrontmatter(cognitiveBridgeSkillMarkdown),
    resources: [
      {
        uri: SKILL_URI,
        digest: `sha256:${await sha256(cognitiveBridgeSkillMarkdown)}`,
      },
    ],
  };
}

function parseSkillFrontmatter(markdown: string): JsonRecord {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("The Cognitive Bridge Skill has no YAML front matter.");
  }
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) {
    throw new Error("The Cognitive Bridge Skill front matter is not closed.");
  }

  const lines = normalized.slice(4, closing).split("\n");
  const frontmatter: JsonRecord = {};
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const root = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (!root) {
      throw new Error("The Cognitive Bridge Skill front matter is unsupported.");
    }
    const key = root[1];
    const value = root[2] ?? "";

    if (/^[>|][+-]?$/.test(value)) {
      const block: string[] = [];
      index += 1;
      while (index < lines.length && (/^\s/.test(lines[index]) || !lines[index])) {
        block.push(lines[index].replace(/^ {2}/, ""));
        index += 1;
      }
      frontmatter[key] = value.startsWith(">")
        ? block.map((item) => item.trim()).filter(Boolean).join(" ")
        : block.join("\n");
      continue;
    }

    if (!value) {
      const nested: JsonRecord = {};
      index += 1;
      while (index < lines.length && (/^\s/.test(lines[index]) || !lines[index])) {
        const nestedLine = lines[index];
        if (!nestedLine.trim()) {
          index += 1;
          continue;
        }
        const entry = /^ {2}([A-Za-z0-9_-]+):\s*(.+)$/.exec(nestedLine);
        if (!entry) {
          throw new Error(
            "The Cognitive Bridge Skill nested front matter is unsupported.",
          );
        }
        nested[entry[1]] = parseYamlScalar(entry[2]);
        index += 1;
      }
      frontmatter[key] = nested;
      continue;
    }

    frontmatter[key] = parseYamlScalar(value);
    index += 1;
  }
  return frontmatter;
}

function parseYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== "string") {
      throw new Error("The Cognitive Bridge Skill scalar must be a string.");
    }
    return parsed;
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function asJsonRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return { value };
}

function asServiceError(error: unknown): ServiceError | null {
  if (!(error instanceof Error)) return null;
  const candidate = error as Error & {
    code?: unknown;
    status?: unknown;
    wwwAuthenticate?: unknown;
  };
  if (
    typeof candidate.code !== "string" ||
    typeof candidate.status !== "number" ||
    !Number.isInteger(candidate.status)
  ) {
    return null;
  }
  return candidate as ServiceError;
}

function asAuthenticationChallenges(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    );
  }
  return [];
}

async function exposeTopLevelToolSecuritySchemes(
  requestBody: unknown,
  response: Response,
): Promise<Response> {
  const requestRecord = asJsonRecord(requestBody);
  if (requestRecord.method !== "tools/list" || !response.ok) return response;

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    return response;
  }
  const payloadRecord = asJsonRecord(payload);
  const result = asJsonRecord(payloadRecord.result);
  if (!Array.isArray(result.tools)) return response;

  const schemesByTool: Record<string, Array<{ type: string; scopes: string[] }>> = {
    go_society_get_context: contextSecuritySchemes,
    go_society_stage_checkpoint: checkpointSecuritySchemes,
    go_society_request_human_review: checkpointSecuritySchemes,
  };
  const tools = result.tools.map((value) => {
    const tool = asJsonRecord(value);
    const schemes =
      typeof tool.name === "string" ? schemesByTool[tool.name] : undefined;
    return schemes ? { ...tool, securitySchemes: schemes } : tool;
  });
  const headers = new Headers(response.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.delete("content-length");
  return new Response(
    JSON.stringify({ ...payloadRecord, result: { ...result, tools } }),
    {
      status: response.status,
      statusText: response.statusText,
      headers,
    },
  );
}

function allowedCorsOrigin(request: Request): string | null {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin) return null;
  try {
    const origin = new URL(rawOrigin).origin;
    if (origin !== rawOrigin) return null;
    if (origin === new URL(request.url).origin) return origin;
    return OPENAI_BROWSER_ORIGINS.has(origin) ? origin : null;
  } catch {
    return null;
  }
}

function withCors(response: Response, corsOrigin: string | null): Response {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  if (corsOrigin) {
    headers.set("access-control-allow-origin", corsOrigin);
    headers.append("vary", "Origin");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonRpcErrorResponse(
  status: number,
  code: number,
  message: string,
  extraHeaders: HeadersInit = {},
): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: { code, message },
      id: null,
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        ...Object.fromEntries(new Headers(extraHeaders)),
      },
    },
  );
}

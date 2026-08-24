import {
  handleMcpOptions,
  handleMcpPost,
  mcpMethodNotAllowed,
} from "../../runtime/mcp-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleMcpPost(request);
}

export function OPTIONS(request: Request): Response {
  return handleMcpOptions(request);
}

export function GET(request: Request): Response {
  return mcpMethodNotAllowed(request);
}

export function DELETE(request: Request): Response {
  return mcpMethodNotAllowed(request);
}

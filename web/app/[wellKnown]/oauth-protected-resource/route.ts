import { buildOAuthProtectedResourceMetadata } from "../../../runtime/oauth-resource-server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ wellKnown: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { wellKnown } = await context.params;
  if (wellKnown !== ".well-known") {
    return Response.json(
      { error: "Not found." },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }
  try {
    return Response.json(buildOAuthProtectedResourceMetadata(request.url), {
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=300",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "OAuth protected-resource metadata is not configured." },
      {
        status: 503,
        headers: {
          "access-control-allow-origin": "*",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }
}

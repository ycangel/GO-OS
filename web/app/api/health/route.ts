import { getDb } from "../../../db";
import { missions } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const [mission] = await getDb()
      .select({ id: missions.id })
      .from(missions)
      .limit(1);
    if (!mission) throw new Error("GO Society has no initialized Mission.");

    return Response.json(
      {
        ok: true,
        service: "go-society",
        version: "0.5.0",
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        service: "go-society",
        version: "0.5.0",
      },
      {
        status: 503,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }
}

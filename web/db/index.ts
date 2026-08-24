import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import type { AtomicSqlStatement } from "./atomic-batch";
import * as schema from "./schema";

export { sqlStatement } from "./atomic-batch";

export function getDatabaseBinding(): D1Database {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return env.DB;
}

export function getRuntimeVariable(name: string): string | undefined {
  const value = (env as unknown as Record<string, unknown>)[name];
  return typeof value === "string" ? value : undefined;
}

export function getDb() {
  return drizzle(getDatabaseBinding(), { schema });
}

/** Cloudflare D1 guarantees that a batch commits or rolls back as one unit. */
export async function executeAtomicBatch(
  statements: readonly AtomicSqlStatement[],
): Promise<void> {
  if (statements.length === 0) return;

  const d1 = getDatabaseBinding();
  await d1.batch(
    statements.map((statement) =>
      d1.prepare(statement.sql).bind(...statement.params),
    ),
  );
}

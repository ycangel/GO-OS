import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";

process.env.GO_SQLITE_PATH = ":memory:";
process.env.GO_SQLITE_MIGRATIONS_DIR = fileURLToPath(
  new URL("../drizzle", import.meta.url),
);

const {
  executeAtomicBatch,
  getDatabaseBinding,
  getDb,
  sqlStatement,
} = await import("../db/index.node.ts");
const { missions } = await import("../db/schema.ts");

test("the Node adapter applies the checked migration chain and serves the Drizzle schema", async () => {
  const db = getDb();
  const rows = await db.select().from(missions);
  assert.equal(rows.length, 4);
  assert.ok(rows.some((mission) => mission.slug === "make-go-runnable"));

  const binding = getDatabaseBinding();
  const migrationRows = await binding
    .prepare(
      "SELECT name, sha256 FROM go_schema_migrations ORDER BY name",
    )
    .all();
  assert.equal(migrationRows.results.length, 6);
  for (const migration of migrationRows.results) {
    assert.match(String(migration.sha256), /^[a-f0-9]{64}$/);
  }

  const triggerCount = await binding
    .prepare(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'cognitive_%'",
    )
    .first("count");
  assert.ok(Number(triggerCount) >= 10);
});

test("the Node atomic batch rolls every statement back when one fails", async () => {
  const capabilityName = "node-sqlite-atomic-rollback";
  await assert.rejects(
    executeAtomicBatch([
      sqlStatement(
        "INSERT INTO capabilities (name) VALUES (?)",
        capabilityName,
      ),
      sqlStatement(
        "INSERT INTO capabilities (name) VALUES (?)",
        capabilityName,
      ),
    ]),
    /UNIQUE constraint failed/,
  );

  const count = await getDatabaseBinding()
    .prepare("SELECT COUNT(*) AS count FROM capabilities WHERE name = ?")
    .bind(capabilityName)
    .first("count");
  assert.equal(Number(count), 0);
});

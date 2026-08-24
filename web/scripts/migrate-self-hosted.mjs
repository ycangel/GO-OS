import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const configuredPath = process.env.GO_SQLITE_PATH?.trim();
const databasePath = configuredPath
  ? isAbsolute(configuredPath)
    ? configuredPath
    : resolve(projectDirectory, configuredPath)
  : resolve(projectDirectory, ".data/go-society.sqlite");
const migrationsDirectory = resolve(projectDirectory, "drizzle");

mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });

const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys = ON");
database.exec("PRAGMA journal_mode = WAL");
database.exec("PRAGMA busy_timeout = 5000");
database.exec(`
  CREATE TABLE IF NOT EXISTS go_schema_migrations (
    name TEXT PRIMARY KEY NOT NULL,
    sha256 TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )
`);

const selectMigration = database.prepare(
  "SELECT sha256 FROM go_schema_migrations WHERE name = ?",
);
const recordMigration = database.prepare(
  "INSERT INTO go_schema_migrations (name, sha256, applied_at) VALUES (?, ?, ?)",
);
const migrations = readdirSync(migrationsDirectory)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();

try {
  for (const name of migrations) {
    const sql = readFileSync(resolve(migrationsDirectory, name), "utf8");
    const digest = createHash("sha256").update(sql).digest("hex");
    const applied = selectMigration.get(name);
    if (applied) {
      if (applied.sha256 !== digest) {
        throw new Error(
          `Migration ${name} changed after it was applied. Refusing to continue.`,
        );
      }
      continue;
    }

    database.exec("BEGIN IMMEDIATE");
    try {
      for (const statement of sql.split("--> statement-breakpoint")) {
        if (statement.trim()) database.exec(statement);
      }
      recordMigration.run(name, digest, new Date().toISOString());
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
    process.stdout.write(`Applied ${name}\n`);
  }

  const integrity = database.prepare("PRAGMA integrity_check").get();
  if (integrity?.integrity_check !== "ok") {
    throw new Error(`SQLite integrity check failed: ${JSON.stringify(integrity)}`);
  }
} finally {
  database.close();
}

try {
  chmodSync(databasePath, 0o600);
} catch {
  // Some mounted volumes do not permit chmod. Container ownership still applies.
}

process.stdout.write(`GO Society database is ready at ${databasePath}\n`);

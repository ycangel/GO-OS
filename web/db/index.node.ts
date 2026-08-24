import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import {
  DatabaseSync,
  type SQLInputValue,
  type SQLOutputValue,
  type StatementSync,
} from "node:sqlite";
import { drizzle } from "drizzle-orm/d1";
import type {
  AtomicSqlStatement,
  SqliteParameter,
} from "./atomic-batch";
import * as schema from "./schema";

export { sqlStatement } from "./atomic-batch";

const MIGRATION_FILE_PATTERN = /^\d{4}_.+\.sql$/;
const MIGRATION_BREAKPOINT = "--> statement-breakpoint";

let sqlite: DatabaseSync | undefined;
let binding: NodeD1Database | undefined;
let orm: ReturnType<typeof createOrm> | undefined;

/**
 * Node-hosted database adapter. The self-host build aliases db/index.ts to
 * this module, while the default Cloudflare build continues to use D1.
 */
export function getDb() {
  orm ??= createOrm(getNodeBinding());
  return orm;
}

export function getDatabaseBinding(): D1Database {
  return getNodeBinding() as unknown as D1Database;
}

export function getRuntimeVariable(name: string): string | undefined {
  return process.env[name];
}

/**
 * Execute a route-level write set synchronously inside one SQLite
 * transaction. No promise is yielded between BEGIN and COMMIT, so another
 * request cannot interleave statements on the process-wide connection.
 */
export async function executeAtomicBatch(
  statements: readonly AtomicSqlStatement[],
): Promise<void> {
  if (statements.length === 0) return;

  const database = getNativeDatabase();
  database.exec("BEGIN IMMEDIATE");
  try {
    for (const statement of statements) {
      database.prepare(statement.sql).run(...normalizeParams(statement.params));
    }
    database.exec("COMMIT");
  } catch (error) {
    rollback(database);
    throw error;
  }
}

function createOrm(client: NodeD1Database) {
  return drizzle(client as unknown as D1Database, { schema });
}

function getNodeBinding(): NodeD1Database {
  binding ??= new NodeD1Database(getNativeDatabase());
  return binding;
}

function getNativeDatabase(): DatabaseSync {
  if (sqlite) return sqlite;

  const databasePath = resolveDatabasePath();
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
  }

  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("PRAGMA busy_timeout = 5000");
    database.exec("PRAGMA journal_mode = WAL");
    applyMigrations(database, resolveMigrationsDirectory());
  } catch (error) {
    database.close();
    throw error;
  }

  if (databasePath !== ":memory:") {
    try {
      chmodSync(databasePath, 0o600);
    } catch {
      // Mounted volumes can reject chmod; their ownership remains authoritative.
    }
  }
  sqlite = database;
  return database;
}

function resolveDatabasePath(): string {
  const configured = process.env.GO_SQLITE_PATH?.trim();
  if (!configured) return resolve(process.cwd(), ".data/go-society.sqlite");
  if (configured === ":memory:") return configured;
  return isAbsolute(configured) ? configured : resolve(process.cwd(), configured);
}

function resolveMigrationsDirectory(): string {
  const configured = process.env.GO_SQLITE_MIGRATIONS_DIR?.trim();
  const candidates = configured
    ? [isAbsolute(configured) ? configured : resolve(process.cwd(), configured)]
    : [
        resolve(process.cwd(), "drizzle"),
        resolve(process.cwd(), "web/drizzle"),
      ];
  const directory = candidates.find((candidate) => existsSync(candidate));
  if (!directory) {
    throw new Error(
      `GO Society SQLite migrations were not found. Checked: ${candidates.join(", ")}`,
    );
  }
  return directory;
}

function applyMigrations(database: DatabaseSync, directory: string): void {
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
  const migrations = readdirSync(directory)
    .filter((name) => MIGRATION_FILE_PATTERN.test(name))
    .sort();
  if (migrations.length === 0) {
    throw new Error(`No GO Society SQLite migrations were found in ${directory}.`);
  }

  for (const name of migrations) {
    const migration = readFileSync(resolve(directory, name), "utf8");
    const digest = createHash("sha256").update(migration).digest("hex");
    database.exec("BEGIN IMMEDIATE");
    try {
      const applied = selectMigration.get(name) as
        | { sha256: string }
        | undefined;
      if (applied) {
        if (applied.sha256 !== digest) {
          throw new Error(
            `SQLite migration ${name} changed after it was applied. Refusing to continue.`,
          );
        }
        database.exec("COMMIT");
        continue;
      }

      for (const statement of migration.split(MIGRATION_BREAKPOINT)) {
        if (statement.trim()) database.exec(statement);
      }
      recordMigration.run(name, digest, new Date().toISOString());
      database.exec("COMMIT");
    } catch (error) {
      rollback(database);
      throw new Error(`Unable to apply SQLite migration ${name}.`, {
        cause: error,
      });
    }
  }
}

function rollback(database: DatabaseSync): void {
  try {
    database.exec("ROLLBACK");
  } catch {
    // Preserve the error that caused the transaction to fail.
  }
}

function normalizeParams(
  values: readonly SqliteParameter[],
): SQLInputValue[] {
  return values.map((value) => {
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value) && !(value instanceof Uint8Array)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    return value as SQLInputValue;
  });
}

function resultMeta(
  database: DatabaseSync,
  startedAt: number,
  rowsRead: number,
): D1Meta & Record<string, unknown> {
  const changes = database
    .prepare("SELECT changes() AS changes, last_insert_rowid() AS lastRowId")
    .get() as { changes: number | bigint; lastRowId: number | bigint };
  const written = Number(changes.changes);
  return {
    duration: Date.now() - startedAt,
    size_after: 0,
    rows_read: rowsRead,
    rows_written: written,
    last_row_id: Number(changes.lastRowId),
    changed_db: written > 0,
    changes: written,
  };
}

class NodeD1Database {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  prepare(query: string): NodeD1PreparedStatement {
    return new NodeD1PreparedStatement(this.database, query);
  }

  async batch<T = unknown>(
    statements: NodeD1PreparedStatement[],
  ): Promise<D1Result<T>[]> {
    if (statements.some((statement) => !statement.belongsTo(this.database))) {
      throw new Error("SQLite batches cannot mix statements from different databases.");
    }

    this.database.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.executeForBatch<T>());
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      rollback(this.database);
      throw error;
    }
  }

  async exec(query: string): Promise<D1ExecResult> {
    const startedAt = Date.now();
    this.database.exec(query);
    return { count: 0, duration: Date.now() - startedAt };
  }
}

class NodeD1PreparedStatement {
  private readonly database: DatabaseSync;
  private readonly query: string;
  private params: readonly SqliteParameter[] = [];

  constructor(database: DatabaseSync, query: string) {
    this.database = database;
    this.query = query;
  }

  belongsTo(database: DatabaseSync): boolean {
    return this.database === database;
  }

  bind(...values: SqliteParameter[]): NodeD1PreparedStatement {
    const statement = new NodeD1PreparedStatement(this.database, this.query);
    statement.params = values;
    return statement;
  }

  async first<T = Record<string, unknown>>(
    colName?: string,
  ): Promise<T | null> {
    const row = this.prepare().get(...normalizeParams(this.params)) as
      | Record<string, SQLOutputValue>
      | undefined;
    if (!row) return null;
    return (colName ? row[colName] : row) as T;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const startedAt = Date.now();
    this.prepare().run(...normalizeParams(this.params));
    return {
      success: true,
      results: [],
      meta: resultMeta(this.database, startedAt, 0),
    };
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.executeForBatch<T>();
  }

  async raw<T = unknown[]>(options?: {
    columnNames?: boolean;
  }): Promise<T[] | [string[], ...T[]]> {
    const statement = this.prepare();
    const params = normalizeParams(this.params);
    const arrayCapable = statement as StatementSync & {
      setReturnArrays?: (enabled: boolean) => void;
      columns?: () => Array<{ name: string }>;
    };
    if (typeof arrayCapable.setReturnArrays === "function") {
      arrayCapable.setReturnArrays(true);
      const rows = statement.all(...params) as unknown as T[];
      if (!options?.columnNames) return rows;
      const names =
        typeof arrayCapable.columns === "function"
          ? arrayCapable.columns().map((column) => column.name)
          : [];
      return [names, ...rows];
    }

    // Node 22.13-22.15 predates setReturnArrays(). Object property order is
    // the same fallback mapping used by Drizzle's D1 driver for batch rows.
    const objectRows = statement.all(...params);
    const names = objectRows[0] ? Object.keys(objectRows[0]) : [];
    const rows = objectRows.map((row) => Object.values(row)) as T[];
    return options?.columnNames ? [names, ...rows] : rows;
  }

  executeForBatch<T>(): D1Result<T> {
    const startedAt = Date.now();
    const results = this.prepare().all(
      ...normalizeParams(this.params),
    ) as T[];
    return {
      success: true,
      results,
      meta: resultMeta(this.database, startedAt, results.length),
    };
  }

  private prepare(): StatementSync {
    return this.database.prepare(this.query);
  }
}

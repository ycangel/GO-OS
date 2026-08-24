export type SqliteParameter =
  | null
  | string
  | number
  | bigint
  | boolean
  | ArrayBuffer
  | ArrayBufferView;

export type AtomicSqlStatement = Readonly<{
  sql: string;
  params: readonly SqliteParameter[];
}>;

/**
 * Describe one parameterized statement without tying route code to D1's
 * prepare/bind objects or to a specific Node SQLite client.
 */
export function sqlStatement(
  sql: string,
  ...params: readonly SqliteParameter[]
): AtomicSqlStatement {
  return { sql, params };
}

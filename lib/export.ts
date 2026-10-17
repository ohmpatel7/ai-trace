/**
 * Exports the whole database for people who want to inspect the backend
 * directly: an Excel workbook (one sheet per table), a plain SQL dump, and a
 * read-only query runner. Nothing here writes to the database.
 */
import Database from "better-sqlite3";
import ExcelJS from "exceljs";
import { DB_PATH } from "./db";

export interface TableDump {
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
}

/** Tables in a sensible reading order; any others follow alphabetically. */
const ORDER = ["users", "courses", "enrolments", "assignments", "submissions", "iterations", "analysis_results", "llm_reviews", "grader_reviews"];

export function tableNames(db: Database.Database): string[] {
  const names = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map((r) => r.name);
  return [...ORDER.filter((n) => names.includes(n)), ...names.filter((n) => !ORDER.includes(n)).sort()];
}

export function dumpTables(db: Database.Database): TableDump[] {
  return tableNames(db).map((name) => {
    const columns = (db.prepare(`PRAGMA table_info(${name})`).all() as { name: string }[]).map((c) => c.name);
    const rows = db.prepare(`SELECT * FROM ${name}`).all() as Record<string, unknown>[];
    return { name, columns, rows };
  });
}

export async function toWorkbook(tables: TableDump[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI Trace (INFOMGMT 399 Team 12)";
  const about = workbook.addWorksheet("About");
  about.columns = [{ width: 24 }, { width: 90 }];
  about.addRows([
    ["AI Trace data export", ""],
    ["Exported", new Date().toISOString()],
    ["Source", "data/ai-trace.db (SQLite), the live database behind the AI Trace prototype"],
    ["Data", "Synthetic. Seeded from ai_trace_synthetic_dataset.xlsx; later rows were added through the app."],
    ["Sheets", "One sheet per database table, with every column and row."],
  ]);
  about.getRow(1).font = { bold: true, size: 14 };
  for (const table of tables) {
    const sheet = workbook.addWorksheet(table.name);
    sheet.columns = table.columns.map((c) => ({ header: c, key: c, width: Math.min(60, Math.max(12, c.length + 4)) }));
    for (const row of table.rows) sheet.addRow(row);
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.eachRow((row) => row.eachCell((cell) => { cell.alignment = { vertical: "top", wrapText: true }; }));
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** A plain SQL file: the schema, then one INSERT per row. Loads into SQLite with `.read`. */
export function toSqlDump(db: Database.Database): string {
  const lines = [
    "-- AI Trace database export (synthetic data). Load with: sqlite3 ai-trace.db < ai-trace-data.sql",
    `-- Exported ${new Date().toISOString()}`,
    "PRAGMA foreign_keys = OFF;",
    "BEGIN TRANSACTION;",
  ];
  for (const name of tableNames(db)) {
    const { sql } = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) as { sql: string };
    lines.push("", `${sql};`);
    const rows = db.prepare(`SELECT * FROM ${name}`).all() as Record<string, unknown>[];
    for (const row of rows) {
      const cols = Object.keys(row);
      lines.push(`INSERT INTO ${name} (${cols.join(", ")}) VALUES (${cols.map((c) => sqlValue(row[c])).join(", ")});`);
    }
  }
  lines.push("", "COMMIT;", "");
  return lines.join("\n");
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  truncated: boolean;
}

const MAX_ROWS = 500;

/**
 * Runs one query on a read-only connection. Only statements that return rows
 * (SELECT, WITH ... SELECT, PRAGMA reads) are accepted; anything that would
 * change data is refused before it runs.
 */
export function runReadOnlyQuery(sql: string, filePath: string = DB_PATH): QueryResult {
  const db = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    const statement = db.prepare(sql.trim().replace(/;\s*$/, ""));
    if (!statement.reader) throw new Error("Only queries that read data (SELECT) can run here.");
    const rows: Record<string, unknown>[] = [];
    for (const row of statement.iterate() as Iterable<Record<string, unknown>>) {
      if (rows.length === MAX_ROWS) return { columns: statement.columns().map((c) => c.name), rows, truncated: true };
      rows.push(row);
    }
    return { columns: statement.columns().map((c) => c.name), rows, truncated: false };
  } finally {
    db.close();
  }
}

/**
 * One SQLite connection for the whole app. The database file lives in data/,
 * and `npm run seed` rebuilds it from scratch.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DB_PATH = process.env.AI_TRACE_DB ?? path.join(process.cwd(), "data", "ai-trace.db");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

type GlobalWithDb = typeof globalThis & { __aiTraceDb?: Database.Database };

export function openDatabase(filePath: string = DB_PATH): Database.Database {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  return db;
}

/** Shared connection, cached across Next.js hot reloads. */
export function getDb(): Database.Database {
  const g = globalThis as GlobalWithDb;
  if (!g.__aiTraceDb) g.__aiTraceDb = openDatabase();
  return g.__aiTraceDb;
}

export function now(): string {
  return new Date().toISOString();
}

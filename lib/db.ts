/**
 * One SQLite connection for the whole app. The database file lives in data/,
 * and `npm run seed` rebuilds it from scratch.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DB_PATH = process.env.AI_TRACE_DB ?? path.join(process.cwd(), "data", "ai-trace.db");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

type GlobalWithDb = typeof globalThis & { __aiTraceDb?: Database.Database; __aiTraceDbPath?: string };

/**
 * True on the hosted site, where the database file lives in Vercel Blob and is
 * copied to /tmp (see lib/remote-db.ts). Locally this is false and nothing changes.
 */
export function isRemote(): boolean {
  return process.env.AI_TRACE_REMOTE === "blob" && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** The file the shared connection is using right now. */
export function currentDbPath(): string {
  return (globalThis as GlobalWithDb).__aiTraceDbPath ?? DB_PATH;
}

export function openDatabase(filePath: string = DB_PATH): Database.Database {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  // Columns added after the first schema; CREATE TABLE IF NOT EXISTS does not add them to an existing file.
  const columns = (db.prepare("PRAGMA table_info(iterations)").all() as { name: string }[]).map((c) => c.name);
  for (const column of ["stage", "scenario_tag"]) {
    if (!columns.includes(column)) db.exec(`ALTER TABLE iterations ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`);
  }
  return db;
}

/** Shared connection, cached across Next.js hot reloads. */
export function getDb(): Database.Database {
  const g = globalThis as GlobalWithDb;
  if (!g.__aiTraceDb) {
    const file = currentDbPath();
    // On a fresh hosted instance, start from the bundled snapshot until the Blob copy arrives.
    const snapshot = path.join(process.cwd(), "deploy", "initial.db");
    if (isRemote() && !fs.existsSync(file) && fs.existsSync(snapshot)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(snapshot, file);
    }
    g.__aiTraceDb = openDatabase(file);
    g.__aiTraceDbPath = file;
  }
  return g.__aiTraceDb;
}

/**
 * Points the shared connection at a newer copy of the database. The old
 * connection stays open briefly so a request already using it can finish.
 */
export function swapDatabase(file: string): void {
  const g = globalThis as GlobalWithDb;
  const old = g.__aiTraceDb;
  const oldPath = g.__aiTraceDbPath;
  g.__aiTraceDb = openDatabase(file);
  g.__aiTraceDbPath = file;
  if (old) {
    setTimeout(() => {
      old.close();
      if (oldPath && oldPath !== file) for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(oldPath + suffix, { force: true });
    }, 30_000).unref?.();
  }
}

export function now(): string {
  return new Date().toISOString();
}

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { dumpTables, runReadOnlyQuery, toSqlDump, toWorkbook } from "@/lib/export";

let dir: string;
let file: string;
let db: Database.Database;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-trace-export-"));
  file = path.join(dir, "test.db");
  db = openDatabase(file);
  seedDatabase(db);
});

afterAll(() => {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

function addStep(prompt: string) {
  const sub = db.prepare("SELECT id FROM submissions LIMIT 1").get() as { id: number };
  db.prepare(
    "INSERT INTO iterations (submission_id, seq, tool_name, prompt, ai_output, critique, action, action_note, created_at, updated_at) VALUES (?, 99, 'ChatGPT', ?, 'out', 'crit', 'edited', '', datetime('now'), datetime('now'))",
  ).run(sub.id, prompt);
}

describe("data exports", () => {
  it("include a step the moment it is logged, in Excel and SQL", async () => {
    addStep("A brand new prompt logged during the demo");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await toWorkbook(dumpTables(db)));
    const sheet = workbook.getWorksheet("iterations")!;
    const headers = (sheet.getRow(1).values as unknown[]).map(String);
    const prompts = sheet.getColumn(headers.indexOf("prompt")).values.map(String);
    expect(prompts).toContain("A brand new prompt logged during the demo");
    expect(toSqlDump(db)).toContain("'A brand new prompt logged during the demo'");
  });

  it("export every table with every row", () => {
    const tables = dumpTables(db);
    for (const t of tables) {
      const count = (db.prepare(`SELECT COUNT(*) c FROM ${t.name}`).get() as { c: number }).c;
      expect(t.rows).toHaveLength(count);
    }
    expect(tables.map((t) => t.name)).toEqual(expect.arrayContaining(["users", "submissions", "iterations", "llm_reviews", "grader_reviews"]));
  });

  it("produce a SQL file that rebuilds the same data", () => {
    const Sqlite = require("better-sqlite3");
    const copy = new Sqlite(":memory:");
    copy.exec(toSqlDump(db));
    const original = db.prepare("SELECT COUNT(*) c FROM iterations").get();
    expect(copy.prepare("SELECT COUNT(*) c FROM iterations").get()).toEqual(original);
    expect(copy.prepare("SELECT prompt FROM iterations WHERE seq = 99").get()).toEqual({ prompt: "A brand new prompt logged during the demo" });
  });

  it("run SELECT queries and refuse anything that changes data", () => {
    db.pragma("wal_checkpoint(TRUNCATE)");
    const result = runReadOnlyQuery("SELECT COUNT(*) AS n FROM users;", file);
    expect(result.columns).toEqual(["n"]);
    expect(() => runReadOnlyQuery("DELETE FROM users", file)).toThrow(/Only queries that read data/);
    expect(() => runReadOnlyQuery("DROP TABLE users", file)).toThrow();
    expect((db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number }).c).toBeGreaterThan(0);
  });
});

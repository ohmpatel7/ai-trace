/**
 * npm run export: writes the current database to exports/ as Excel, SQL and a
 * copy of the SQLite file, for including with a submission.
 */
import fs from "node:fs";
import path from "node:path";
import { DB_PATH, openDatabase } from "../lib/db";
import { dumpTables, toSqlDump, toWorkbook } from "../lib/export";

const outDir = path.join(process.cwd(), "exports");
fs.mkdirSync(outDir, { recursive: true });
const db = openDatabase(DB_PATH);
const tables = dumpTables(db);
fs.writeFileSync(path.join(outDir, "ai-trace-data.xlsx"), await toWorkbook(tables));
fs.writeFileSync(path.join(outDir, "ai-trace-data.sql"), toSqlDump(db));
fs.writeFileSync(path.join(outDir, "ai-trace.db"), db.serialize());
db.close();
console.log(`Wrote exports/ai-trace-data.xlsx, exports/ai-trace-data.sql and exports/ai-trace.db`);
for (const t of tables) console.log(`  ${t.name.padEnd(18)} ${t.rows.length} rows`);

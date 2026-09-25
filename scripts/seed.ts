/**
 * npm run seed: rebuild data/ai-trace.db from the synthetic cases.
 */
import { DB_PATH, openDatabase } from "../lib/db";
import { seedDatabase, seedCases } from "../lib/seed";

// Tables are cleared and refilled in place, so a running dev server picks the new data up without a restart.
const db = openDatabase(DB_PATH);
seedDatabase(db);
const rows = db
  .prepare(
    `SELECT u.name, s.status, a.overlap_pct, a.tier FROM submissions s
     JOIN users u ON u.id = s.student_id JOIN analysis_results a ON a.submission_id = s.id ORDER BY s.id`,
  )
  .all() as { name: string; status: string; overlap_pct: number; tier: string }[];
console.log(`Seeded ${DB_PATH} with ${seedCases.length} synthetic submissions:`);
for (const r of rows) console.log(`  ${r.name.padEnd(14)} ${r.status.padEnd(12)} ${String(r.overlap_pct).padStart(3)}%  ${r.tier}`);
db.close();

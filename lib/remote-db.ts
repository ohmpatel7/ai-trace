/**
 * Keeps the hosted site's SQLite file in Vercel Blob, because Vercel's own disk
 * is temporary and differs between server instances.
 *
 * - syncDb() runs at the start of every request (through getViewer). It asks
 *   Blob whether the stored copy changed since this instance last saw it, and
 *   downloads it if so. An unchanged copy costs one small "not modified" check.
 * - persistDb() runs after every save and uploads the whole file (about 120 KB).
 *
 * Two people saving at the same instant on different instances: the later
 * upload wins. That is fine for a demo, and noted in DEPLOY.md.
 */
import { get, put } from "@vercel/blob";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getDb, isRemote, swapDatabase } from "./db";

const BLOB_PATH = "ai-trace/ai-trace.db";

type BlobState = typeof globalThis & {
  __blobEtag?: string;
  __blobCheckedAt?: number;
  __blobSync?: Promise<void> | null;
};

export async function syncDb(): Promise<void> {
  if (!isRemote()) return;
  const g = globalThis as BlobState;
  if (g.__blobSync) return g.__blobSync;
  if (g.__blobCheckedAt && Date.now() - g.__blobCheckedAt < 1000) return; // layout and page in one request share a check
  g.__blobSync = (async () => {
    const result = await get(BLOB_PATH, { access: "private", useCache: false, ifNoneMatch: g.__blobEtag });
    if (!result) {
      // First run ever: publish the starting database so every instance shares it.
      await persistDb();
    } else if (result.statusCode === 200) {
      const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
      const file = path.join(os.tmpdir(), `ai-trace-${Date.now()}.db`);
      fs.writeFileSync(file, bytes);
      swapDatabase(file);
      g.__blobEtag = result.blob.etag;
    }
    g.__blobCheckedAt = Date.now();
  })().finally(() => {
    g.__blobSync = null;
  });
  return g.__blobSync;
}

export async function persistDb(): Promise<void> {
  if (!isRemote()) return;
  const g = globalThis as BlobState;
  const saved = await put(BLOB_PATH, getDb().serialize(), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/vnd.sqlite3",
  });
  g.__blobEtag = saved.etag;
  g.__blobCheckedAt = Date.now();
}

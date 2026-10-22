/**
 * "View as" identity. A cookie names the user row the visitor is acting as.
 * Real sign-in is out of scope for the prototype; see About this prototype.
 */
import { cookies } from "next/headers";
import { getUser, listUsers } from "./queries";
import { syncDb } from "./remote-db";
import type { User } from "./types";

export const VIEWER_COOKIE = "ai_trace_viewer";

export async function getViewer(): Promise<User> {
  // Every page, action and download asks who is viewing first, so this is where the hosted copy is refreshed.
  await syncDb();
  const store = await cookies();
  const raw = store.get(VIEWER_COOKIE)?.value;
  const user = raw ? getUser(Number(raw)) : undefined;
  return user ?? listUsers()[0];
}

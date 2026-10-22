# The live site

AI Trace is hosted by WebTag on Vercel.

| | |
|---|---|
| Live URL | https://ai-trace.webtag.co.nz |
| GitHub repo that deploys | `webtagosd/ai-trace` (branch `main`) |
| Vercel project | `ai-trace` in the `webtagosd` team, region Sydney (`syd1`) |
| Database storage | private Vercel Blob store `ai-trace-db` (Sydney) |

The personal repo `ohmpatel7/ai-trace` still exists for the team. Only pushes to `webtagosd/ai-trace` change the live site.

## How the database works when hosted

Vercel's disk is temporary and differs between server instances, so a plain SQLite file would lose saves. When `AI_TRACE_REMOTE=blob` is set, `lib/remote-db.ts` keeps the file in Vercel Blob:

- Before each request, the server asks Blob whether the stored database changed and downloads it if so. An unchanged file costs one small "not modified" check.
- After each save (logging a step, handing in work, notes, LLM checks, reset), the server uploads the whole file, about 120 KB.
- The very first time, there is nothing in Blob yet, so it starts from `deploy/initial.db`, a snapshot that includes the LLM results and the demo video's steps.

Limit: if two people save at the same moment on different server instances, the later upload wins and the other save is lost. That's fine for a demo with a few users.

Locally none of this runs. `npm run dev` still uses `data/ai-trace.db` as before.

## Settings on the Vercel project

| Variable | Purpose |
|---|---|
| `AI_TRACE_REMOTE=blob` | switches on Blob storage |
| `AI_TRACE_DB=/tmp/ai-trace.db` | where the working copy lives on the server |
| `BLOB_READ_WRITE_TOKEN` | added automatically by the Blob store |
| `SITE_PASSWORD` | the password the site asks for (sensitive) |
| `ANTHROPIC_API_KEY` | for the LLM check (sensitive) |

## Updating the live site

Push to `main` on `webtagosd/ai-trace`:

```bash
git push webtag main
```

Vercel builds and deploys automatically. The data in Blob is kept across deploys.

To start the live data over from the snapshot, delete the blob `ai-trace/ai-trace.db` in the `ai-trace-db` store (Vercel dashboard, Storage). The next visit republishes `deploy/initial.db`. **Reset demo data** on the site rebuilds from the team spreadsheet instead, which has no LLM results.

## Why there's a password

Anyone with the link could switch to the grader, see every record, reset the data, or hand in work that triggers paid LLM calls on the API key. The browser asks for a username (type anything) and the `SITE_PASSWORD`.

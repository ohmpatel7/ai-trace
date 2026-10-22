# Putting AI Trace on a live site

AI Trace saves everything in a SQLite file, so it needs a host with a **persistent disk**. Serverless hosts like Vercel or Netlify reset their files, so saves would vanish. These steps use **Railway**, which builds the included `Dockerfile` straight from GitHub and offers persistent volumes. Check Railway's current pricing when you sign up; a small app like this costs a few dollars a month at most.

Use your **personal** GitHub account (ohmpatel7), not a WebTag one.

## Steps (about 10 minutes, all in the browser)

1. Go to https://railway.com and **log in with GitHub** as ohmpatel7.
2. **New Project**, then **Deploy from GitHub repo**, then pick `ohmpatel7/ai-trace`. If it isn't listed, use "Configure GitHub App" to give Railway access to that private repo.
3. Railway finds the `Dockerfile` and starts building. Let it run; the first build takes a few minutes.
4. **Add a volume** so data survives restarts: on the canvas, right-click the service (or press Cmd+K and search "volume"), choose **Attach volume**, and set the mount path to `/data`.
5. Open the service's **Variables** tab and add:

   | Name | Value |
   |---|---|
   | `AI_TRACE_DB` | `/data/ai-trace.db` |
   | `ANTHROPIC_API_KEY` | your own key (only needed for the LLM check) |
   | `SITE_PASSWORD` | a password you choose, to share with the team and markers |

6. **Settings**, then **Networking**, then **Generate Domain**. If it asks for a port, use `3000`.
7. Railway redeploys with the new settings. Open the domain it gives you. The browser asks for a username and password: type anything as the username, and the `SITE_PASSWORD` as the password.

## What happens on first boot

`scripts/start.sh` looks for the database at `AI_TRACE_DB`. On the very first boot it isn't there, so it copies `deploy/initial.db`, a snapshot of the local data including the LLM check results and the demo video's steps. After that the file on the volume is the live database, and every save persists across restarts and redeploys.

- **Reset demo data** on the live site rebuilds it from the team spreadsheet, which has no LLM results. Press **Check all submitted work** on each class view afterwards to bring them back (needs the API key).
- To start over from the snapshot instead, delete the volume and attach a new one.
- Without the volume and `AI_TRACE_DB`, the site still runs, but data resets on every deploy.

## Updating the live site

Push to `main` on GitHub. Railway rebuilds and redeploys automatically, and the data on the volume is kept.

## Why there's a password

Anyone with the link can switch "View as" to the grader, see every record, press Reset demo data, and hand in work that triggers paid LLM calls on your API key. `SITE_PASSWORD` keeps the site to people you give it to. Leave it unset only if that's fine.

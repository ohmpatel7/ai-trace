# AI Trace

A University of Auckland INFOMGMT 399 capstone prototype (Team 12). AI Trace lives as one tab inside a course for **Lane 2** assessments, where AI use is permitted. Students log each AI step while they work. Graders read how a submission was made instead of reading raw chat logs.

Two interfaces over one record store:

- **Student AI-use log.** The student writes their work wherever they normally do and hands it in through Assignments as usual. In AI Trace they log each AI step (prompt, AI output, their critique, what they did next). Handing the work in locks the log. Students see their own records only; the analysis is the grader's.
- **Process Visualiser.** The grader reviews the class, then one submission, with reused AI wording highlighted in the colour of the step it came from. Every highlight and every figure opens the record behind it.

AI Trace supports marking; it does not perform it. Scores only cover AI output the student chose to log and are never findings about the student.

New to the project? Start with [HOW-IT-WORKS.md](HOW-IT-WORKS.md), a plain-language guide to what it does and how to run it.

## Run it

```bash
npm install
npm run seed
npm run dev
```

Then open http://localhost:3000 (or the port Next prints). Use **View as** in the top bar to switch between the grader and the eight students. **Reset demo data** or `npm run seed` rebuilds the database from the synthetic cases.

```bash
npm test
```

runs the overlap library tests, the critique rule tests, and a test that the seeded records match the dataset's own step and word counts.

The overlap, tier and critique figures need no environment variables or external services: they are word matching and word counts on the server.

**LLM reflection check (optional).** To turn it on, copy `.env.example` to `.env.local`, paste your own Anthropic API key, and restart `npm run dev`. Without a key, the app runs normally and the check buttons say how to turn it on.

- Claude (`claude-opus-5-5`, set in `lib/config.ts`) reads each logged step and returns, per step, "Looks considered" or "Look closer" with a one-line reason. It looks for critiques that are missing, generic, could apply to any output, or accept an unsupported claim.
- It runs automatically when a student hands work in, and on demand from the grader's class view ("Check all submitted work").
- Results live in their own table, keyed by a hash of the step, so an edited step shows "changed since check" until it is re-run. Nothing is written back into student records.
- Submissions with steps to look closer at sort first in the class view, and the results appear on each step and in the PDF report.
- It is advisory. The grader decides what a suggestion means, and the wording never implies misconduct.
- It sends logged steps to Anthropic's API. Use synthetic data only unless the university has approved otherwise.

## Hosting it

To put it on a live site with a persistent database, follow [DEPLOY.md](DEPLOY.md) (Railway, using the included `Dockerfile`).

## Getting the data out

As the grader, the **Database** page shows every table live, runs read-only SQL queries, and downloads all data as Excel, SQL or the SQLite file. From the terminal:

```bash
npm run export
```

writes `exports/ai-trace-data.xlsx`, `exports/ai-trace-data.sql` and `exports/ai-trace.db` from the current database.

## Stack

Next.js (App Router) with TypeScript, SQLite through `better-sqlite3` with a plain SQL schema, plain CSS with variables, Vitest. No auth library, no ORM, no component library.

## Where things are

| Path | What it is |
|---|---|
| `lib-source/overlap.js` | The overlap calculation. Copied unchanged to `lib/overlap/overlap.js`; do not edit either copy. |
| `lib-source/overlap.test.js` | Its tests. |
| `lib-source/ai_trace_synthetic_dataset.xlsx`, `lib-source/dataset.json` | The team's synthetic dataset and its sheet-for-sheet JSON conversion. |
| `lib/overlap/index.ts` | Typed wrapper around the overlap calculation. |
| `lib/critique.ts` | Critique labels and critique depth. |
| `lib/config.ts` | Every threshold in one place. |
| `lib/export.ts` | Excel and SQL exports and the read-only query runner. |
| `lib/llm-review.ts` | The LLM reflection check: prompt, structured output schema, caching by step hash. |
| `lib/analysis.ts` | Computes and caches overlap and critique results per submission. Never writes to student records. |
| `lib/seed.ts`, `scripts/seed.ts` | Seed the database. |
| `db/schema.sql` | The schema. |
| `app/ai-trace/actions.ts` | Every write the app makes. |
| `app/ai-trace/...` | The screens: landing, workspace, class view, submission view, printable summary. |
| `reference/layout_1.html` | A teammate's earlier design demo, kept as a visual reference. |

## How the figures are made

- **Overlap.** A run of `n` (6) consecutive words in the final text that also appears in a logged AI output counts as reused. Two reused runs from the same step with at most `maxGap` (2) changed words between them are joined; the changed words are counted as *bridged*. Overlap is reused words over total words.
- **Tier.** Below 50%: *Mostly own wording*. 50% to 69%: *Worth a closer read*. 70% and above: *Read the process closely*. The tier is a reading aid for the grader, never a finding about the student.
- **Critique label per step.** Empty critique: *No critique recorded*. Under 15 words and the action is "accepted": *Accepted without evaluation*. Under 15 words otherwise: *Thin critique*. 15 words or more: *Substantive critique*.
- **Critique depth per submission.** The median critique word count.

All thresholds live in `lib/config.ts` and are printed on the grader's submission view.

## Working, simulated, planned

| Area | State | Notes |
|---|---|---|
| Student AI-use log | Working | Logging and editing AI steps per assignment. Students see their own records only; overlap, tiers and critique labels appear on grader screens. |
| Handing work in | Simulated | Students hand work in through Assignments. Here that is a paste box; in a real course it is the LMS upload, which locks the AI-use log. |
| Overlap and tiers | Working | Word matching between the submitted work and logged AI outputs. No AI model is involved in these figures. |
| LLM reflection check | Working | Optional, needs an Anthropic API key. Claude suggests which critiques to look closer at; advisory only. |
| PDF report | Working | Export PDF report on any submission, then Print or save as PDF. |
| Critique labels | Working | Plain word-count rules per step, and critique depth as the median across a submission. |
| Grader class view and submission view | Working | Sorting, search, the reviewed toggle, private notes, highlights that open the step behind them. |
| Shared database | Working | SQLite on the server, so every viewer sees the same records. |
| Identity | Simulated | The View as switcher picks a user row. There is no sign-in. |
| Course shell | Simulated | The navigation reads as an LMS course page, but only the AI Trace tab does anything. |
| Student and grader data | Simulated | The team's synthetic dataset: 12 fictional students, 3 assignments, 36 logged steps. It records the AI-use log only, not the submitted work. |
| LMS integration | Planned | A real deployment would be an LTI 1.3 tool launched from the course, with identity and roles supplied by the LMS. |
| Multiple courses and assignments | Planned | The schema supports them; the interface shows one course. |
| Capturing steps automatically | Planned | Students currently paste each step in by hand. |

## Synthetic data

The seed is the team's `ai_trace_synthetic_dataset.xlsx`: 12 fictional students, one project each across three assignments, three logged steps per project, and a Definitions sheet (shown on the About page). Every record is fictional. The dataset records the AI-use log only and deliberately excludes the submitted work, so the grader's overlap figure reads "No previous similar work to compare" for these students. Its own volume measure, logged student share, is shown on each submission.

Mapping from the sheet: `student_id` is the UPI, `assignment_title` and `assignment_task` become assignments, `stage` is kept on each step, the `student_revision_or_action` sentence is kept as the step note with a fixed action derived from it (removed or unverified: rejected; kept, rewrote, replaced: edited; otherwise accepted), and `review_example` is stored as test metadata only and never shown as a finding. One blank account (Oliver Bennett) is added outside the dataset for live walkthroughs.

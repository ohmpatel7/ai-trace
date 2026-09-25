# AI Trace

A University of Auckland INFOMGMT 399 capstone prototype (Team 12). AI Trace lives as one tab inside a course for **Lane 2** assessments, where AI use is permitted. Students log each AI step while they work. Graders read how a submission was made instead of reading raw chat logs.

Two interfaces over one record store:

- **Student AI-use log.** The student writes their work wherever they normally do and hands it in through Assignments as usual. In AI Trace they log each AI step (prompt, AI output, their critique, what they did next). Handing the work in locks the log. Students see their own records only; the analysis is the grader's.
- **Process Visualiser.** The grader reviews the class, then one submission, with reused AI wording highlighted in the colour of the step it came from. Every highlight and every figure opens the record behind it.

AI Trace supports marking; it does not perform it. Scores only cover AI output the student chose to log and are never findings about the student.

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

runs the overlap library tests, the critique rule tests, and a test that the seeded submissions land on the intended tiers.

No environment variables, no external services, no AI model or API calls. All analysis is word matching and word counts on the server.

## Stack

Next.js (App Router) with TypeScript, SQLite through `better-sqlite3` with a plain SQL schema, plain CSS with variables, Vitest. No auth library, no ORM, no component library.

## Where things are

| Path | What it is |
|---|---|
| `lib-source/overlap.js` | The overlap calculation. Copied unchanged to `lib/overlap/overlap.js`; do not edit either copy. |
| `lib-source/overlap.test.js` | Its tests. |
| `lib-source/synthetic_cases.js` | The nine synthetic students (S1 to S9) and the two assignments. |
| `lib/overlap/index.ts` | Typed wrapper around the overlap calculation. |
| `lib/critique.ts` | Critique labels and critique depth. |
| `lib/config.ts` | Every threshold in one place. |
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
| Overlap and tiers | Working | Word matching between the draft and logged AI outputs. No AI model is involved. |
| Critique labels | Working | Plain word-count rules per step, and critique depth as the median across a submission. |
| Grader class view and submission view | Working | Sorting, search, the reviewed toggle, private notes, highlights that open the step behind them. |
| Printable summary | Working | A print stylesheet over the same records. |
| Shared database | Working | SQLite on the server, so every viewer sees the same records. |
| Identity | Simulated | The View as switcher picks a user row. There is no sign-in. |
| Course shell | Simulated | The navigation reads as an LMS course page, but only the AI Trace tab does anything. |
| Student and grader data | Simulated | Nine synthetic students chosen to show every tier, label and edge case, including one who has not started. |
| LMS integration | Planned | A real deployment would be an LTI 1.3 tool launched from the course, with identity and roles supplied by the LMS. |
| Multiple courses and assignments | Planned | The schema supports them; the interface shows one course. |
| Capturing steps automatically | Planned | Students currently paste each step in by hand. |

## Synthetic data

Every person, company and figure is invented. The nine cases are chosen so that every tier, critique label, action and edge case appears: a submission with no steps logged, one still in progress, one with heavy reuse and thin critiques, one with heavy reuse and careful critiques, and one blank workspace (Oliver Bennett) for a live walkthrough. The UI labels the data as synthetic on every screen.

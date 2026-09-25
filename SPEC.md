# AI Trace: Claude Code build spec (v2)

This replaces the earlier spec. It is a **port**, not a new design: a working single-file demo already exists and defines the intended behaviour. The job is to rebuild it as a real application with a shared database, without changing what it does.

## Folder setup before you start

Put these in an empty project folder:

```
SPEC.md                  <- this file
reference/demo.html      <- the working demo (ai_trace_demo.html)
reference/layout_1.html  <- teammate's earlier design demo (visual reference only)
lib-source/overlap.js            <- the core calculation, do not modify
lib-source/overlap.test.js       <- its tests, must keep passing
lib-source/synthetic_cases.js    <- the nine synthetic submissions
```

Then open Claude Code in that folder and use the kickoff prompt at the end of this file.

---

## 1. What this is

AI Trace is a University of Auckland capstone prototype (INFOMGMT 399, Team 12). It is a tool that lives as one tab inside a Canvas-style course, for **Lane 2** assessments where AI use is permitted. Graders must judge how critically a student used AI; that evidence otherwise sits in raw chat logs that do not scale.

Two interfaces over one record store:

- **Student workspace.** The student drafts the assignment and logs each AI step while working: prompt, AI output, their critique, what they did next.
- **Process Visualiser.** The grader reviews the class, then an individual submission, with reused AI wording highlighted and every highlight opening the record behind it.

**`reference/demo.html` is the specification of behaviour.** Open it, click through both roles, and match what it does. Where this document and the demo disagree, ask rather than choosing.

## 2. What changes from the demo

| Demo | This build |
|---|---|
| Browser localStorage | SQLite database, shared across users |
| "View as" switcher | Keep it, but backed by real user rows (identity still simulated) |
| One hard-coded assignment | Assignment rows in the database; the UI still shows one course |
| One HTML file | Next.js App Router project with TypeScript |
| Reset button reseeds localStorage | `npm run seed` reseeds the database; keep a reset action for demos |

Everything else, all screens, wording, rules and behaviour, is ported as-is.

## 3. Non-negotiable rules

1. **Do not modify `overlap.js`.** Copy it into `lib/` and wrap it in a typed module. If you believe it has a bug, stop and explain; do not edit it. Its ten tests must keep passing.
2. **No AI model or API calls, ever.** All analysis is word matching and word counts. No network requests at runtime.
3. **Language rules.** Never use: detect, AI-detected, flag for misconduct, catch, suspicious, cheating, integrity alert. Records are "AI steps" or "AI reflections", never "evidence of AI use". The role is "Grader", never "Teacher". Tier labels: "Mostly own wording", "Worth a closer read", "Read the process closely".
4. **Students and graders are equally important users.** Never describe one as primary or secondary in code, comments, UI or README.
5. **Analytics never mutate records.** Overlap and critique results are computed from the record store and cached; they are never written back into student records.
6. **Every number expands to its record.** No figure appears anywhere without a path to the underlying text that produced it.
7. **Grader screens carry this footer:** "AI Trace supports marking; it does not perform it. Scores only cover AI output the student chose to log and are never findings about the student."
8. **Synthetic data must be labelled as such** in the UI.

## 4. Stack

- Next.js (App Router) + TypeScript
- SQLite via `better-sqlite3`; plain SQL schema file; seed script
- Plain CSS with CSS variables, ported from the demo's stylesheet. No component library, no CSS framework.
- Tests: `node --test` or Vitest
- Runs with `npm install && npm run seed && npm run dev`. No environment secrets, no external services.

Keep it simple. No auth libraries, no ORM, no state-management library, no AI SDK.

## 5. Data model

- `users`: id, name, upi, role (`student` | `grader`)
- `courses`: id, code, name, semester
- `enrolments`: user_id, course_id, role
- `assignments`: id, course_id, title, lane (1 | 2), instructions, due_at, expected_min_iterations
- `submissions`: id, assignment_id, student_id, final_text, status (`not_started` | `in_progress` | `submitted`), updated_at, submitted_at
- `iterations`: id, submission_id, seq, tool_name, prompt, ai_output, critique, action (`accepted` | `edited` | `rejected` | `verified_elsewhere`), action_note, created_at, updated_at
- `analysis_results`: submission_id, computed_at, config_json, overlap_pct, tier, covered_words, total_words, bridged_words, spans_json, critique_json — a cache, always recomputable, never hand-edited
- `grader_reviews`: submission_id, grader_id, reviewed, note, updated_at

Recompute `analysis_results` whenever a submission's final text or any of its iterations change.

## 6. Configuration

One file, `lib/config.ts`, holding every threshold: overlap `n` = 6, `maxGap` = 2, `greenBelow` = 50, `redAbove` = 70, `thinWords` = 15, `expectedMin` = 3. The grader's submission view prints the active settings, as the demo does.

## 7. Screens to port

Match `reference/demo.html` screen for screen.

**Course shell.** Left nav: Home, Announcements, Assignments, Discussions, Grades, People, Files, AI Trace, plus "About this prototype". Non-AI-Trace items show a placeholder. Top bar: "View as" switcher, reset action. Synthetic-data banner.

**Student: AI Trace landing.** Lane 2 assignments are openable, with due date, status and step count. Lane 1 assignments are greyed out with a note that AI Trace is not used.

**Student: workspace.** Draft editor on the left with autosave; AI steps timeline on the right; a dialog for logging or editing a step with tool, prompt, AI output, critique, action and note; a live critique cue as the critique is typed; a pre-submit panel showing the student's own step count against the minimum, their own overlap and tier, the explanation that reuse is permitted in Lane 2, and their draft with reused passages highlighted; submit with confirmation, then lock.

**Grader: class view.** Summary tiles (submissions, median steps against minimum, tier spread, reviewed count); the distribution of critique labels across every logged step; a table with search, "not yet reviewed only", and sorting by review priority, name or overlap. Not-yet-submitted students show no tier and are not openable.

**Grader: submission view.** Header stats plus the active settings; the final text with reused passages highlighted in the colour of their source step; selecting a passage opens that step's record (keyboard accessible); step cards showing prompt, AI output, critique, action and critique label; a private grader note and a reviewed toggle.

**Grader: printable summary.** Header stats, tier explanation, a table of steps with critique labels and text, and the grader's note. Clean print stylesheet.

**About this prototype.** The working / simulated / planned table, including that identity and the course shell are simulated and that a real deployment would use LTI 1.3.

## 8. Critique rules

Per step: *no critique recorded* (empty), *accepted without evaluation* (action is accepted and critique is under `thinWords`), *thin critique* (under `thinWords`), *substantive critique* (otherwise). Per submission, **critique depth** is the median critique word count. Show the rule behind any label on hover or in an info panel.

## 9. Seed data

Port the demo's seed exactly: one grader (Taylor Ngata), eight students (Daniel Okafor, Jordan Miller, Sofia Rossi, Priya Raman, Mei Lin Tan, Liam Patel, Rewi Tainui, Amelia Chen), one Lane 2 assignment on the fictional Kōwhai Retail breach, one Lane 1 assignment. Liam Patel is mid-assignment; the rest have submitted. Submissions are built from the S1–S8 scenarios so every tier and edge case appears.

After seeding, the tiers must match the demo. Add a test asserting this.

## 10. Design

Port the demo's stylesheet: same palette, spacing, rounded cards, tier colours and highlight colours; light and dark support; serif for text the user reads (drafts, AI output, critiques), sans-serif for interface chrome. Tier chips always carry a text label, never colour alone. Keyboard-reachable highlights, visible focus, labelled fields, WCAG AA contrast, responsive to 375px.

Do not use Instructure or Canvas logos or copy their exact visual design; the shell should simply read as an LMS course page.

## 11. Build phases — stop after each and report

1. **Foundation.** Project setup, schema, seed, `lib/overlap` wrapping `overlap.js` unchanged, `lib/critique`, config, tests.
   *Check:* `npm test` passes, including the ported overlap tests; seeded tiers match the demo.
2. **Shell + student workspace.** Course shell, View-as, landing, workspace, step create/edit/delete, autosave, pre-submit panel, submit and lock.
   *Check:* as Liam Patel, log a step, edit the draft, watch the overlap change, submit, confirm it locks.
3. **Grader Process Visualiser.** Class view with filters and sorting, submission view, expand-to-record, notes, reviewed toggle.
   *Check:* review priority puts red first; selecting a highlight opens the matching step.
4. **Export and polish.** Printable summary, About page, placeholder pages, accessibility and responsive pass, README.
   *Check:* README lists run steps and the working / simulated / planned table.

## 12. Working rules

- After each phase: list what works, what is stubbed, and any decision the team should review.
- Prefer a few clear files over abstraction layers. This code gets explained in a university report, so favour readability over cleverness.
- NZ/UK spelling in all user-facing text ("organise", "colour").
- Do not add features beyond this spec. If something seems missing, ask.

---

## Kickoff prompt

> Read SPEC.md in full, then open reference/demo.html and click through both the student and grader views so you know the behaviour you are porting. Do not write any code yet. First give me: a one-paragraph summary of what you are building, your file structure plan, and any question where SPEC.md and the demo disagree. Then wait for my go-ahead and build Phase 1 only, stopping when its checks pass.

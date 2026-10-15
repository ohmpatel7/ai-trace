# AI Trace: how it works and how to run it

## What it is

AI Trace is our prototype for Lane 2 assignments, where students are allowed to use AI. It does two jobs:

1. **Students log their AI use.** Each time they use an AI tool, they record a step: what they asked, what the AI said, what they thought of the answer (their critique), and what they did next. They still write and hand in their actual work the normal way, through the Assignments tab.
2. **Graders see how the AI was used.** For each student, the grader sees every logged step, plus some simple figures and an LLM check that points out critiques worth a closer look.

All the data is made up. It comes from our team dataset, `ai_trace_synthetic_dataset.xlsx` (12 students, 3 assignments, 36 steps).

## Trying it out

- Use **View as** at the top to switch between the grader (Taylor Brooks) and any student. It's one shared database, so what a student does shows up for the grader straight away.
- **As a student:** the AI Trace tab is where you log steps. The Assignments tab is where you hand work in. Handing work in locks the log.
- **As the grader:** open an assignment to see the class, then click a student to see their steps, the figures, the LLM result on each step, and the **Export PDF report** button.
- **Oliver Bennett** is a blank student. Use him to show the whole flow from scratch.
- **Reset demo data** puts everything back to the starting data.

## How the numbers work

These are plain word counts. No AI is involved in them.

- **Critique label.** Each critique is labelled by its length. Empty is "No critique recorded". Under 15 words on a step the student accepted is "Accepted without evaluation". Under 15 words otherwise is "Thin critique". 15 words or more is "Substantive critique".
- **Critique depth.** The middle critique length across a student's steps.
- **Flagged as AI.** The share of the words in a student's log that the AI wrote, compared with the words the student wrote. It measures volume only, not quality.
- **Overlap.** If a student's handed-in work contains 6 or more words in a row copied from an AI answer they logged, that passage is highlighted and counted. Our dataset doesn't include handed-in work, so this shows "No previous similar work to compare" for those 12 students. Try it with Oliver Bennett.

## How the LLM check works

This is the part from our proposal.

1. When work is handed in, or when the grader presses **Check all submitted work** on the class view, the app sends each student's logged steps to Claude, Anthropic's AI model.
2. For each step, Claude reads the critique next to the AI answer it responds to. It decides whether the critique actually engages with the answer, or looks low-effort ("Looks fine to me", blank, or accepting an unsupported claim).
3. It answers **Looks considered** or **Look closer**, with a one-line reason. The grader sees this on each step, and students with steps to look closer at move to the top of the class list.

It's a suggestion for the grader, not a judgement about the student. The grader always decides. On our dataset it picked out exactly the 5 steps the dataset marks as weak critiques.

## Running it on your laptop

You need **Node.js 20 or newer** (download from https://nodejs.org). Check with `node -v`.

First time:

```bash
git clone https://github.com/ohmpatel7/ai-trace.git
cd ai-trace
npm install
npm run seed
npm run dev
```

Then open http://localhost:3000.

Already cloned it before? Get the latest version with:

```bash
git pull
npm install
npm run seed
npm run dev
```

### Turning on the LLM check (optional)

Everything works without this. Only the LLM check needs it.

1. Get your own API key from https://console.anthropic.com/settings/keys (the account needs a little credit; checking the whole class costs a few cents).
2. In the project folder, copy the example settings file:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local`, paste your key straight after `ANTHROPIC_API_KEY=` (no spaces or quotes), and save.
4. Stop the app with Ctrl+C and run `npm run dev` again.
5. As the grader, open an assignment and press **Check all submitted work**.

Never share your key or put it on GitHub. `.env.local` is set up so git ignores it.

## If something goes wrong

- **`npm install` fails on "better-sqlite3".** Your computer needs build tools. On a Mac run `xcode-select --install`. On Windows install "Desktop development with C++" from the Visual Studio Installer. Then run `npm install` again.
- **The check buttons are greyed out.** The key isn't loaded. Check `.env.local` and restart `npm run dev`.
- **Data looks wrong or old.** Run `npm run seed`, or press Reset demo data.

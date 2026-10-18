# Technical demo video: script and test cases

A silent recording of this whole script is in `video/ai-trace-demo-silent.mp4` (4:46), with voice-over timestamps in `video/ai-trace-demo-timestamps.md`. Both are on the recording laptop only; they are not on GitHub.

Team 12, AI Trace. Maximum 10 minutes. Follows the timing in the Presentation and Technical Demo Guide.

Replace "Member 1" to "Member 4" with names. Every member should speak at least once so roles are clear.

## Before you record

1. Start the app: `cd ~/Projects/Uni/ai-trace && npm run dev -- --port 4421`, then open http://localhost:4421.
2. Make sure Oliver Bennett is blank: View as Oliver, open AI Trace, and check every Lane 2 assignment says "0 AI steps logged". If not, press **Reset demo data**, then as Taylor Brooks press **Check all submitted work** on each class view so the LLM results come back.
3. Keep `.env.local` and any terminal showing the API key off screen. The guide says never to show keys.
4. Have the copy-paste text below in a note, so typing doesn't eat your time.
5. Close the Excel file if it's open, so the fresh download is obvious.

## Scene 1. Introduction (0:00 to 0:30). Member 1

On screen: the AI Trace home page.

> "We're Team 12. AI Trace is for Lane 2 assignments, where students can use AI. Students log each AI step: what they asked, what the AI said, and their critique. Graders then see how AI was used, without reading raw chat logs. Everything you'll see uses synthetic data."

## Scene 2. End-to-end journey (0:30 to 3:30). Member 2

This is Test 1 recorded live, so it does double duty.

1. **View as Oliver Bennett** (a blank student). Open **AI Trace**, then **Campus transport policy memo**.
   > "Oliver is using ChatGPT while writing his memo."
2. Press **Log an AI step** and paste Test 1's text (below). Point out the live cue: "29 words. Substantive critique." Press **Log step**.
   > "The critique is required, and the form tells him how it reads as he types."
3. Open **Assignments**, then **Campus transport policy memo**. Paste Test 1's work and press **Submit**, then confirm.
   > "He hands in his work the normal way. That saves his log, and the LLM check runs in the background."
4. **View as Taylor Brooks.** Open **AI Trace**, then **Campus transport policy memo**. Show the class view: the bar of critique labels and Oliver's new row.
5. Click **Oliver Bennett**. Show the four boxes, the critique bar, the highlighted passage in his work, and the step card with "Substantive critique" and "LLM: Looks considered". Click the highlight to show it opens the step.
   > "The grader can see which sentence came from the AI, which step it came from, and what Oliver thought of it."

## Scene 3. Test cases (3:30 to 6:30). Member 3

Show the table for each test on a slide or in the voice-over: input, expected, actual, pass.

**Test 1 (normal case).** Already shown in Scene 2. Recap the result on Oliver's page.

**Test 2 (boundary, error and different-user case).**

1. As Oliver, open **AI Trace**, then **Food waste intervention memo**, then **Log an AI step**. Paste the tool, prompt and AI output from Test 2, but leave the critique **empty**. Press **Log step**.
   > "An empty critique is refused. The form says 'Your critique is required. The step was not saved.'"
2. Type the critique "Looks fine to me." The cue changes to "Thin critique". Press **Log step**.
3. Hand in Test 2's work through **Assignments**.
4. As Taylor Brooks, open Oliver's Food waste page. Show "Thin critique", "LLM: Look closer" and its reason, the 92% flagged as AI, and the 98% overlap.
   > "The AI's unsupported claim was accepted with a four-word critique. The LLM check points the grader to it, with a reason."
5. Different-user check: View as any student and show the **Database** link is gone. Then type `localhost:4421/database` in the address bar to show "The database view is for graders".

## Scene 4. Data, logic and components (6:30 to 8:30). Member 4

1. **Data.** As Taylor Brooks, open **Database**. Show Oliver's two new steps at the top of "Logged AI steps".
   > "Every save goes into a SQLite database straight away. It was loaded from our synthetic dataset spreadsheet."
2. Click **All data as Excel (.xlsx)** and open it. Oliver's steps are in the top rows of the "Logged AI steps" sheet.
3. In **Run a SQL query**, press **Steps the LLM check flagged**. Oliver's Food waste step appears with the dataset's weak critiques.
4. **Logic.** Show three short pieces of code, about 15 seconds each. Don't scroll through files.
   - `lib/config.ts`: the thresholds, such as 6 words for overlap and 15 words for a substantive critique.
   - `lib/critique.ts`, function `critiqueLabel`: the four critique rules in a few lines.
   - `lib/llm-review.ts`, `SYSTEM_PROMPT`: what we ask Claude to judge, and that the answer is a suggestion, not a finding.
5. **Architecture in one sentence.**
   > "The browser sends each save to our Next.js server, which writes to SQLite, recalculates the word-count figures, and for hand-ins asks Claude to review the critiques. Grader screens read it all back."

## Scene 5. Limitations and AI use (8:30 to 9:30). Member 1

**Simulated, incomplete or planned:**

- Sign-in is simulated with the "View as" switcher. A real version would launch from the LMS through LTI 1.3.
- Only the AI Trace tab works. The rest of the course menu is placeholders.
- Handing in work is a paste box, standing in for the LMS file upload.
- Students paste each AI step in by hand. Capturing steps from the AI tool automatically is planned.
- The database is local to the laptop running the app. It is not hosted.
- The LLM check needs an API key and sends logged steps to Anthropic. That's fine for synthetic data, but real students would need university approval.
- Our dataset doesn't include submitted work, so its 12 students show "No previous similar work to compare".
- "Flagged as AI" and the critique labels measure word volume, not quality. The LLM check is advisory and can vary between runs.

**Material AI use.** State it plainly.

> "We used Claude Code, an AI coding tool, to write most of the code. Our team wrote the spec, built the synthetic dataset, and directed every design change: the colours, removing step minimums, the student and grader layouts, the required critique, and the database exports. We checked it with 46 automated tests and the two test cases you just saw. The LLM check itself uses Claude at run time. Our prompt log is in our submission."

## Test cases

### Test 1. Normal case: considered use of AI

| | |
|---|---|
| User | Oliver Bennett (student), then Taylor Brooks (grader) |
| Assignment | Campus transport policy memo |
| Input | One logged step with a 29-word critique; work that reuses one AI sentence |
| Expected | Step saved. "Substantive critique". LLM check says "Looks considered". The reused sentence is highlighted and counted. The step appears on the Database page and in Excel. |
| Actual (tested 18 Oct 2026) | Saved. Substantive critique, 29 words. LLM: considered, because the critique "flags the unsupported car-trip claim, says the student checked the campus travel survey, and kept only the sourced safety point". Overlap 32% (20 of 63 words), flagged as AI 46%. Shown on the Database page and in the Excel download. |
| Result | Pass |

Copy-paste text:

- Tool: `ChatGPT`
- Prompt: `Should the university extend evening shuttle hours? Give me two benefits and two costs.`
- AI output: `Extending evening shuttle hours would improve safety for students who study late and could reduce car trips to campus. The main costs are extra driver wages and low ridership after 9pm, which may make each trip expensive.`
- Critique: `The benefits are reasonable but it gives no evidence for reduced car trips, so I checked the campus travel survey and only kept the safety point with a source.`
- Work to hand in:

```
Memo: evening shuttle hours.

Extending evening shuttle hours would improve safety for students who study late and could reduce car trips to campus. The campus travel survey supports the safety point, but I found no evidence for fewer car trips, so I do not rely on it.

I recommend a one-semester trial of shuttles until 10pm, measured by ridership and student safety reports.
```

### Test 2. Boundary, error and different-user case: low-effort critique

| | |
|---|---|
| User | Oliver Bennett (student), then Taylor Brooks (grader), then any student for the access check |
| Assignment | Food waste intervention memo |
| Input | (a) Step with an empty critique. (b) The same step with "Looks fine to me." on a 123-word AI answer. (c) Work copied almost entirely from the AI. (d) A student opening the Database page. |
| Expected | (a) Refused, nothing saved. (b) Saved as "Thin critique". LLM check says "Look closer". (c) Overlap and flagged as AI both 90% or higher. (d) Student is blocked. |
| Actual (tested 18 Oct 2026) | (a) Refused: "Your critique is required. The step was not saved." (b) Saved; cue showed "4 words, Thin critique"; LLM: look closer, because the critique "is generic; unsupported claims like composting eliminating all emissions and one-semester payback go unexamined". (c) Overlap 98% (123 of 126 words), flagged as AI 92%, "Read the process closely". (d) Link hidden; page says "The database view is for graders". |
| Result | Pass |

Copy-paste text (built so the figures land above 90%):

- Tool: `ChatGPT`
- Prompt: `Write my café food waste memo.`
- AI output:

```
Composting eliminates all food waste emissions, so a student café that composts its scraps has no environmental impact from food waste at all. The café should introduce compost bins in the kitchen and dining area, train staff to separate scraps at the end of every shift, and partner with a local garden that collects the compost each week. Smaller portion options are not needed once composting is in place, because every scrap is turned into soil instead of landfill. The programme pays for itself within one semester through lower rubbish collection fees, and students will see the café as a leader in sustainability. The manager should launch the scheme at the start of next term and report the results to the student association.
```

- Critique (second try): `Looks fine to me.`
- Work to hand in: the line `Food waste memo`, a blank line, then the whole AI output above pasted unchanged.

## Notes

- The LLM's wording can differ slightly between runs, so read out what appears on screen. The verdicts above held when tested.
- After recording, press **Reset demo data** if you want to record again. Then run **Check all submitted work** on each class view to bring the LLM results back.

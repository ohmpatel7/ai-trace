/**
 * Synthetic AI Trace data. Every person, company and figure here is invented
 * for the INFOMGMT 399 prototype. Nothing is drawn from a real student.
 *
 * Each case is one student's submission for the Lane 2 assignment, chosen so
 * that every tier, critique label, action and edge case appears somewhere.
 */

export const course = {
  code: "INFOMGMT 399",
  name: "Information Management Capstone",
  semester: "2026 Semester Two",
};

export const grader = { name: "Taylor Brooks", upi: "tbro001" };

export const assignments = [
  {
    key: "lab1",
    title: "Lab 1: Critiquing an AI summary",
    lane: 2,
    due_at: "2026-08-14T23:59:00+12:00",
    expected_min_iterations: 1,
    instructions:
      "Ask an AI tool to summarise the week 3 reading on data minimisation, then write 150 words on what the summary got right, what it missed, and what you would change. Log the step in AI Trace.",
    // Every student except the blank walkthrough account has finished this one.
    everyone: {
      status: "submitted",
      submitted_at: "2026-08-13T17:20:00+12:00",
      final_text:
        "The summary was accurate on the definition of data minimisation but treated it as a storage question only. The reading's main point is that minimisation starts at collection: if a field is never gathered it never needs protecting. I rewrote the opening to say that, kept the summary's list of retention practices, and dropped its claim that the Privacy Act sets fixed retention periods, which it does not.",
      iterations: [
        {
          tool_name: "ChatGPT",
          prompt: "Summarise the week 3 reading on data minimisation in three sentences.",
          ai_output:
            "Data minimisation means holding only the personal information an organisation needs for a stated purpose. Organisations should review stored records regularly and delete what is no longer required. The Privacy Act sets fixed retention periods that organisations must follow.",
          critique:
            "The first two sentences are fair. The third is wrong: the Privacy Act 2020 says information should not be kept longer than needed for the purpose, but it does not set fixed retention periods. It also misses the reading's main argument that minimisation begins at collection rather than at deletion.",
          action: "edited",
          action_note: "Kept the first two sentences as a starting point, corrected the third.",
        },
      ],
    },
  },
  {
    key: "lane1",
    title: "Assignment 1: Reflective essay on information ethics",
    lane: 1,
    due_at: "2026-08-21T23:59:00+12:00",
    expected_min_iterations: 0,
    instructions:
      "A 1,000 word reflective essay written without AI assistance. AI Trace is not used for Lane 1 assessments.",
  },
  {
    key: "quiz2",
    title: "Quiz 2: Information governance",
    lane: 1,
    due_at: "2026-09-11T23:59:00+12:00",
    expected_min_iterations: 0,
    instructions: "A closed-book online quiz. AI Trace is not used for Lane 1 assessments.",
  },
  {
    key: "lane2",
    title: "Assignment 2: Kōwhai Retail breach memo",
    lane: 2,
    due_at: "2026-10-02T23:59:00+13:00",
    expected_min_iterations: 3,
    instructions:
      "Write a 300 to 500 word memo to the board of Kōwhai Retail explaining how the March 2026 data breach happened, what it has cost the business, and the three changes you would prioritise. " +
      "This is a Lane 2 assessment: AI tools are permitted. Log every AI step in AI Trace while you work, including the prompt, the output, your own critique of it, and what you did next. " +
      "Reusing AI wording is allowed. What is assessed is how critically you used it. At least three steps are expected.",
  },
  {
    key: "a3",
    title: "Assignment 3: Privacy impact assessment",
    lane: 2,
    due_at: "2026-10-23T23:59:00+13:00",
    expected_min_iterations: 3,
    instructions:
      "Complete a privacy impact assessment for the proposed Kōwhai Retail loyalty app. AI tools are permitted; log every step in AI Trace. At least three steps are expected.",
    everyone: {
      status: "in_progress",
      submitted_at: null,
      final_text: "",
      iterations: [
        {
          tool_name: "Claude",
          prompt: "What sections does a privacy impact assessment usually have?",
          ai_output:
            "A privacy impact assessment usually covers: the purpose of the project, what personal information is collected, how it flows through systems and third parties, the risks to individuals, the controls that reduce those risks, and who signed off.",
          critique:
            "Matches the Office of the Privacy Commissioner's PIA toolkit closely enough to use as my section headings. It does not mention consulting the affected people, which the toolkit treats as important, so I have added that as a section.",
          action: "edited",
          action_note: "Used as headings, added a consultation section.",
        },
      ],
    },
  },
  {
    key: "a4",
    title: "Assignment 4: Vendor risk briefing",
    lane: 2,
    due_at: "2026-11-06T23:59:00+13:00",
    expected_min_iterations: 3,
    instructions:
      "Write a two page briefing on the information risks of moving Kōwhai Retail's point-of-sale system to a third-party cloud vendor. AI tools are permitted; log every step in AI Trace.",
  },
];

// A common frame for the AI outputs so the scenarios read as one course.
const CAUSE_AI =
  "The Kōwhai Retail breach began when an attacker signed in to the staff portal using a warehouse contractor's shared account. " +
  "The password had been reused from an unrelated site that was compromised in 2024, and because the portal did not require multi-factor authentication, a valid password was enough. " +
  "Over the next nine days the attacker exported the loyalty database in small batches, collecting about 41,000 customer records that included names, email addresses, phone numbers, partial street addresses and loyalty point balances. " +
  "No payment card numbers were stored in the portal, so none were taken.";

const COST_AI =
  "The direct cost of the incident is currently estimated at NZ$1.2 million, covering forensic investigation, legal advice, customer notification and a twelve-month credit monitoring offer. " +
  "The indirect cost is larger: online sales fell by roughly a fifth in the month after the breach became public, and the finance team estimates a NZ$3 million shortfall against forecast. " +
  "The Office of the Privacy Commissioner was notified on day sixteen, later than the Privacy Act 2020 expects, which exposes the company to a compliance finding on top of the reputational damage.";

const RECS_AI =
  "First, require multi-factor authentication for every account that can reach the staff portal, including contractors, so that a leaked password alone is no longer sufficient. " +
  "Second, retire shared contractor accounts and issue named logins with an expiry date, so that access can be traced to a person and removed when a contract ends. " +
  "Third, alert on bulk exports from the loyalty database and rehearse an incident response plan that commits the company to notifying the Privacy Commissioner within 72 hours of discovery.";

export const cases = [
  {
    id: "S1",
    title: "Accepted every output as written",
    student: { name: "Daniel Cooper", upi: "dcoo412" },
    status: "submitted",
    submitted_at: "2026-09-19T21:14:00+12:00",
    expectedTier: "red",
    final_text:
      "Memo to the board\n\n" +
      CAUSE_AI +
      "\n\n" +
      COST_AI +
      "\n\n" +
      RECS_AI +
      "\n\n" +
      "In summary, the breach was the result of an ordinary password reuse problem meeting a portal that trusted passwords alone, and the three changes above close that gap at a cost far below what the incident has already consumed.",
    iterations: [
      {
        tool_name: "ChatGPT",
        prompt: "Write the opening section of a board memo explaining how the Kōwhai Retail data breach happened. Use the facts from the case brief.",
        ai_output: CAUSE_AI,
        critique: "Looks good.",
        action: "accepted",
        action_note: "",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Now write a paragraph on what the breach has cost the business.",
        ai_output: COST_AI,
        critique: "Fine, matches the case.",
        action: "accepted",
        action_note: "",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Write three prioritised recommendations for the board.",
        ai_output: RECS_AI,
        critique: "",
        action: "accepted",
        action_note: "",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Write a one sentence closing for the memo.",
        ai_output:
          "In summary, the breach was the result of an ordinary password reuse problem meeting a portal that trusted passwords alone, and the three changes above close that gap at a cost far below what the incident has already consumed.",
        critique: "Good ending.",
        action: "accepted",
        action_note: "Pasted in as the last line.",
      },
    ],
  },

  {
    id: "S2",
    title: "Edited the drafts, critiqued unevenly",
    student: { name: "Jordan Miller", upi: "jmil778" },
    status: "submitted",
    submitted_at: "2026-09-20T16:40:00+12:00",
    expectedTier: "amber",
    final_text:
      "To the board of Kōwhai Retail\n\n" +
      "This memo covers the cause, the cost and three changes.\n\n" +
      "The breach began when an attacker signed in to the staff portal using a warehouse contractor's shared account. The password had been reused from an unrelated site that was compromised in 2024, and because the portal did not require multi-factor authentication, a valid password was enough. Over the next nine days the attacker exported the loyalty database in small batches, collecting about 41,000 customer records that included names, email addresses, phone numbers, partial street addresses and loyalty point balances. No payment card numbers were stored in the portal, so none were taken, which is the one piece of good news in the case.\n\n" +
      "On cost, the forensics, legal work and customer notification have come to about NZ$1.2 million, and online sales dropped by around a fifth in the following month. My own view is that the late notification to the Privacy Commissioner, on day sixteen, will end up being the more expensive mistake because it turns a security failure into a compliance one.\n\n" +
      "First, require multi-factor authentication for every account that can reach the staff portal, including contractors, so that a leaked password alone is no longer sufficient. Second, retire shared contractor accounts and issue named logins with an expiry date, so that access can be traced to a person and removed when a contract ends. Third, set a rule that the Privacy Commissioner is told within 72 hours of discovery, and rehearse it, because on the evidence of March we would not have met that deadline.",
    iterations: [
      {
        tool_name: "ChatGPT",
        prompt: "Give me an outline for a 400 word board memo about a retail data breach: cause, cost, recommendations.",
        ai_output:
          "1. Purpose of the memo (one sentence). 2. What happened: entry point, how long the attacker had access, what data was taken. 3. What it cost: direct response costs, lost revenue, regulatory exposure. 4. Three prioritised recommendations, each with the problem it fixes. 5. Closing line on urgency.",
        critique:
          "The outline is sensible but it puts cost before the notification issue, which I think is the real lesson from the case, so I moved the Privacy Commissioner point into the cost section and made it my own argument.",
        action: "edited",
        action_note: "Used the five headings but reordered the argument.",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Draft the 'what happened' section using these facts: contractor shared account, reused password from a 2024 leak, no MFA, nine days, 41,000 loyalty records, no card data.",
        ai_output: CAUSE_AI,
        critique: "Good but a bit generic.",
        action: "edited",
        action_note: "Added a line about the card data being good news.",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Write three prioritised recommendations for the board.",
        ai_output: RECS_AI,
        critique:
          "The first two recommendations are what I would have written anyway. The third one buries the 72 hour notification inside a sentence about export alerts, so I split it out and made the notification rule the whole third point, with a reason drawn from the March timeline.",
        action: "edited",
        action_note: "Kept one and two nearly as written, rewrote three.",
      },
    ],
  },

  {
    id: "S3",
    title: "Used AI to plan and check, wrote it herself",
    student: { name: "Sophie Turner", upi: "stur203" },
    status: "submitted",
    submitted_at: "2026-09-21T10:05:00+12:00",
    expectedTier: "green",
    final_text:
      "Board memo: the March breach and what to do about it\n\n" +
      "Nobody broke into Kōwhai Retail. Someone walked in with a key we had left under the mat. A contractor account that four people shared used a password that had already appeared in a 2024 leak, and our staff portal asked for nothing else. That is the whole story of the entry, and it is why I am not recommending any new security product.\n\n" +
      "The attacker stayed for nine days and left with around 41,000 loyalty records. Names, emails, phone numbers and point balances are enough to write a convincing phishing email, which is exactly how we found out: a customer forwarded one that quoted her balance. Card numbers were never in the portal.\n\n" +
      "Direct costs sit near NZ$1.2 million and the finance team expects a NZ$3 million revenue shortfall. I want to be candid about a third cost. We notified the Privacy Commissioner on day sixteen. The Privacy Act 2020 expects notification as soon as practicable after a notifiable breach, and I do not think we can argue that sixteen days was practicable when IT had confirmed the export on day eight.\n\n" +
      "Three changes, in order. Turn on multi-factor authentication for every remote login, contractors included, before the end of the month. Close every shared account and give each contractor a named login that expires with their contract. Write down who calls the Privacy Commissioner, and by when, and run the drill twice a year. None of these needs a new budget line. All three would have stopped or shortened March.",
    iterations: [
      {
        tool_name: "Claude",
        prompt: "I'm writing a 400 word board memo on a retail breach. Suggest a structure that leads with the cause and keeps recommendations to three.",
        ai_output:
          "Open with a one line summary of how the attacker got in. Then cover what was taken and how it was discovered. Then costs, split into direct, revenue and regulatory. Then three recommendations ordered by how directly each one would have prevented the incident. Close by tying the recommendations back to the cause.",
        critique:
          "This is close to what I had in mind but it treats discovery as a detail. In this case the discovery route, a customer forwarding a phishing email, is the strongest evidence the data is already being used, so I gave it its own sentence in the second paragraph.",
        action: "edited",
        action_note: "Followed the order, promoted the discovery detail.",
      },
      {
        tool_name: "Claude",
        prompt: "What does New Zealand's Privacy Act 2020 require for notifying the Privacy Commissioner after a breach?",
        ai_output:
          "Under the Privacy Act 2020, an agency must notify the Privacy Commissioner as soon as practicable after becoming aware of a notifiable privacy breach, meaning one likely to cause serious harm. Affected individuals must also be notified unless an exception applies. There is no fixed number of days in the Act, but the Commissioner's guidance treats delays beyond 72 hours as needing explanation.",
        critique:
          "I did not want to put a legal claim in a board memo on the strength of a chatbot, so I checked the Office of the Privacy Commissioner's breach guidance. The 'as soon as practicable' wording is right and the 72 hour expectation is in their guidance rather than the Act itself, which is how I have described it.",
        action: "verified_elsewhere",
        action_note: "Checked against privacy.org.nz breach notification guidance.",
      },
      {
        tool_name: "Claude",
        prompt: "Argue against making multi-factor authentication the top recommendation.",
        ai_output:
          "MFA adds friction for warehouse staff who share devices, may not cover legacy integrations that use the portal, and does not address the root problem of shared accounts. A stronger first recommendation might be identity governance: knowing who has access and removing it promptly.",
        critique:
          "Useful as a stress test but I rejected it. Shared devices are a real issue, yet a named login with MFA on a shared device is still far better than a shared password with nothing. The identity governance point is my second recommendation, so the argument mostly supports the order I already had.",
        action: "rejected",
        action_note: "Kept MFA first.",
      },
      {
        tool_name: "Claude",
        prompt: "Here is my draft. Is the tone right for a board, and is anything unclear?",
        ai_output:
          "The tone is direct and appropriate. Two suggestions: the phrase 'left under the mat' is vivid but may read as blaming staff; and the closing could state the total cost of the three changes so the board can weigh it against the NZ$1.2 million already spent.",
        critique:
          "I kept the mat line because the memo should say plainly that this was avoidable, and the blame sits with the policy, not the contractor. I took the second suggestion partly: I say none of the changes needs a new budget line rather than inventing a figure I do not have.",
        action: "edited",
        action_note: "Adjusted the closing only.",
      },
    ],
  },

  {
    id: "S4",
    title: "Submitted with no AI steps logged",
    student: { name: "Emily Watson", upi: "ewat556" },
    status: "submitted",
    submitted_at: "2026-09-18T18:22:00+12:00",
    expectedTier: "green",
    final_text:
      "Memo to the Kōwhai Retail board\n\n" +
      "The March breach was a failure of access control rather than a sophisticated attack. A warehouse contractor's account, shared between several people, was protected by a password that had already been exposed in an unrelated 2024 leak. The staff portal accepted that password on its own. From there the attacker spent nine days quietly exporting the loyalty database, around 41,000 records, before a customer's phishing complaint told us something was wrong.\n\n" +
      "The bill so far is about NZ$1.2 million in forensics, legal costs and customer support, with a further NZ$3 million expected in lost online sales. We also told the Privacy Commissioner on day sixteen, which I expect to be criticised, since our own IT team confirmed the export on day eight.\n\n" +
      "I recommend three changes. Multi-factor authentication on every portal login, including contractors. Named, expiring accounts instead of shared ones. And a written incident plan that names who notifies the Commissioner and gives them 72 hours to do it. Each of these is cheap, and any one of them would have made March shorter.\n\n" +
      "I have not used AI tools for this memo. I wanted to see whether I could write it from the case brief alone.",
    iterations: [],
  },

  {
    id: "S5",
    title: "Many steps, most of them rejected",
    student: { name: "Hannah Lewis", upi: "hlew934" },
    status: "submitted",
    submitted_at: "2026-09-21T22:47:00+12:00",
    expectedTier: "green",
    final_text:
      "Board memo on the March 2026 breach\n\n" +
      "How it happened. Credential stuffing is the automated reuse of leaked username and password pairs against other services. That is what hit us: a contractor's shared portal login used a password from a 2024 leak, the portal had no second factor, and the attacker was in. Nine days later, roughly 41,000 loyalty records had been exported in small batches that nobody was watching for.\n\n" +
      "What it cost. NZ$1.2 million in direct response so far. The bigger number is the NZ$3 million revenue shortfall finance now expects, driven by a drop of about a fifth in online sales. The late notification to the Privacy Commissioner, sixteen days after discovery and eight after IT confirmed it, adds regulatory exposure we could have avoided for free.\n\n" +
      "What to change. One: multi-factor authentication for every account that can reach the staff portal, including contractors. Two: retire shared contractor accounts and issue named logins with an expiry date. Three: alert on bulk exports from the loyalty database, because nine days of quiet exporting is a monitoring failure as much as an access one, and pair that with a rehearsed 72 hour notification rule.\n\n" +
      "I have deliberately kept the recommendations to changes we can make with existing tools. The case brief gives no evidence that a new product would have helped; a policy would have.",
    iterations: [
      {
        tool_name: "ChatGPT",
        prompt: "In one sentence, define credential stuffing for a non-technical reader.",
        ai_output:
          "Credential stuffing is the automated reuse of leaked username and password pairs against other services in the hope that people have reused the same login.",
        critique:
          "Accurate and plain, and better than my own attempt which used the word 'attack vector'. I trimmed the second half of the sentence because the memo goes on to say exactly that in Kōwhai's own terms.",
        action: "accepted",
        action_note: "Used the first clause as the opening definition.",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Draft the 'how it happened' section of the memo from the case brief.",
        ai_output: CAUSE_AI,
        critique:
          "It is correct but reads like a news report. A board memo needs the causal chain in one breath: reused password, no second factor, nobody watching exports. I wrote that chain myself and did not use the draft.",
        action: "rejected",
        action_note: "",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Draft the cost section.",
        ai_output:
          "The breach has cost Kōwhai Retail an estimated NZ$4.6 million to date, including a NZ$500,000 fine from the Privacy Commissioner and the loss of 12,000 loyalty members who closed their accounts.",
        critique:
          "None of these numbers are in the case brief. There is no fine in the brief, the Privacy Commissioner does not issue fines of that kind, and the member churn figure is invented. This is exactly the kind of output that looks authoritative and is not, so I rejected it and used the brief's figures.",
        action: "rejected",
        action_note: "Figures do not match the brief.",
      },
      {
        tool_name: "ChatGPT",
        prompt: "How quickly does the Privacy Act 2020 require breach notification?",
        ai_output:
          "The Privacy Act 2020 requires notifiable privacy breaches to be reported to the Privacy Commissioner as soon as practicable. The Commissioner's guidance indicates that notification later than 72 hours after becoming aware should be explained.",
        critique:
          "I checked this on the Privacy Commissioner's website and it matches: 'as soon as practicable' is the statutory test and 72 hours is guidance. I use the 72 hour figure as a target we set ourselves, not as a legal deadline.",
        action: "verified_elsewhere",
        action_note: "Confirmed at privacy.org.nz.",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Write three prioritised recommendations for the board.",
        ai_output: RECS_AI,
        critique:
          "The first two recommendations are sound and I kept them close to the draft. The third combines two different problems, monitoring and notification, so I rewrote it to say why monitoring matters in this case: nine days of exports went unseen.",
        action: "edited",
        action_note: "Kept one and two, rewrote three.",
      },
      {
        tool_name: "Grammarly",
        prompt: "Proofread the full memo for typos.",
        ai_output: "Two spelling corrections suggested: 'recieve' to 'receive', 'seperate' to 'separate'. No grammar issues found.",
        critique: "Fixed two typos, nothing else changed.",
        action: "accepted",
        action_note: "",
      },
    ],
  },

  {
    id: "S6",
    title: "Still working, one step so far",
    student: { name: "Liam Walker", upi: "lwal621" },
    status: "in_progress",
    submitted_at: null,
    expectedTier: "green",
    final_text: "",
    iterations: [
      {
        tool_name: "ChatGPT",
        prompt: "Explain how the Kōwhai Retail breach happened for a board memo.",
        ai_output: CAUSE_AI,
        critique: "Seems right.",
        action: "accepted",
        action_note: "",
      },
    ],
  },

  {
    id: "S7",
    title: "Reused heavily, critiqued carefully",
    student: { name: "Ryan Hughes", upi: "rhug087" },
    status: "submitted",
    submitted_at: "2026-09-22T09:31:00+12:00",
    expectedTier: "red",
    final_text:
      "Board memo: March breach\n\n" +
      "The Kōwhai Retail breach began when an attacker signed in to the staff portal using a warehouse contractor's shared account. The password had been reused from an unrelated site that was compromised in 2024, and because the portal did not require multi-factor authentication, a valid password was all it took. Over the next nine days the attacker exported the loyalty database in small batches, collecting about 41,000 customer records that included names, email addresses, phone numbers, partial street addresses and loyalty point balances. No payment card numbers were stored in the portal, so none were taken.\n\n" +
      "The direct cost of the incident is currently estimated at NZ$1.2 million, covering forensic investigation, legal advice, customer notification and a twelve-month credit monitoring offer. The indirect cost is larger: online sales fell by roughly a fifth in the month after the breach became public, and the finance team estimates a NZ$3 million shortfall against forecast. The Privacy Commissioner was notified on day sixteen, well after the Privacy Act 2020 expects, which exposes the company to a compliance finding on top of the reputational damage.\n\n" +
      "First, require multi-factor authentication for every account that can reach the staff portal, including contractors, so that a leaked password alone is no longer enough. Second, retire shared contractor accounts and issue named logins with an expiry date, so that access can be traced to a person and removed when a contract ends. Third, alert on bulk exports from the loyalty database and rehearse an incident response plan that commits the company to notifying the Privacy Commissioner within 72 hours of discovery.\n\n" +
      "I checked each of these against the brief and they hold. My one addition is that the third change matters most: the first two stop the next attacker getting in, the third stops the next one staying for nine days.",
    iterations: [
      {
        tool_name: "Claude",
        prompt: "Write the 'how it happened' section of a board memo about the Kōwhai Retail breach, using only the facts in this brief: [brief pasted].",
        ai_output: CAUSE_AI,
        critique:
          "I checked every fact against the brief: the 2024 leak, nine days, 41,000 records, the data fields and the absence of card numbers all match. The wording is clearer than mine, so I kept it, changing only 'enough' to 'all it took' because the board will read that as more direct. I am relying on the wording but not on the facts unverified.",
        action: "edited",
        action_note: "One phrase changed after checking the facts.",
      },
      {
        tool_name: "Claude",
        prompt: "Write the cost section from the same brief.",
        ai_output: COST_AI,
        critique:
          "The NZ$1.2 million, the fifth drop in sales and the NZ$3 million shortfall are all in the brief. The phrase 'later than the Privacy Act 2020 expects' understates it given IT confirmed the export on day eight, so I changed it to 'well after'. I also dropped 'The Office of' because the memo elsewhere just says Privacy Commissioner.",
        action: "edited",
        action_note: "Strengthened the notification point.",
      },
      {
        tool_name: "Claude",
        prompt: "Write three prioritised recommendations that each fix a specific cause from the section above.",
        ai_output: RECS_AI,
        critique:
          "Each recommendation maps to a cause: MFA to the password reuse, named accounts to the shared login, export alerts and the 72 hour rule to the nine day dwell time. That is the structure I asked for and I agree with it, so I kept the three as written apart from 'sufficient' to 'enough'. I added my own closing paragraph to explain why I would rank the third change highest in practice.",
        action: "edited",
        action_note: "Kept the three, added my own ranking argument.",
      },
    ],
  },

  {
    id: "S8",
    title: "Short memo, patchy critique",
    student: { name: "Amelia Clarke", upi: "acla319" },
    status: "submitted",
    submitted_at: "2026-09-22T23:58:00+12:00",
    expectedTier: "amber",
    final_text:
      "Memo to the board\n\n" +
      "The March breach was caused by a contractor's shared portal account whose password had leaked in 2024. The portal did not require multi-factor authentication, so the password was enough, and the attacker exported about 41,000 loyalty records over nine days.\n\n" +
      "The direct cost of the incident is currently estimated at NZ$1.2 million, covering forensic investigation, legal advice, customer notification and a twelve-month credit monitoring offer. Online sales are down about a fifth and finance expects a NZ$3 million shortfall, which is the number the board will remember.\n\n" +
      "I would prioritise three changes. Require multi-factor authentication for every account that can reach the staff portal, including contractors. Retire shared contractor accounts and issue named logins with an expiry date. And write a notification plan with a 72 hour target, because sixteen days was too long and everyone in the room knows it.\n\n" +
      "I have kept this short because the board already has the full incident report.",
    iterations: [
      {
        tool_name: "ChatGPT",
        prompt: "Summarise how the Kōwhai Retail breach happened in two sentences.",
        ai_output:
          "The March breach was caused by a contractor's shared portal account whose password had leaked in 2024. The portal did not require multi-factor authentication, so the password was enough, and the attacker exported about 41,000 loyalty records over nine days.",
        critique: "",
        action: "accepted",
        action_note: "",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Write the cost paragraph.",
        ai_output: COST_AI,
        critique: "ok",
        action: "accepted",
        action_note: "Kept the first sentence, rewrote the rest.",
      },
      {
        tool_name: "ChatGPT",
        prompt: "Write three prioritised recommendations for the board.",
        ai_output: RECS_AI,
        critique:
          "I kept the first two because they are exactly what the brief points to. The third was too long and mixed monitoring with notification, so I cut it down to the notification target and added my own reason, since the sixteen day delay is the thing the board will already be embarrassed about.",
        action: "edited",
        action_note: "Shortened all three, rewrote the third.",
      },
    ],
  },
  {
    id: "S9",
    title: "Not started: a blank workspace for a live walkthrough",
    student: { name: "Oliver Bennett", upi: "oben742" },
    status: "not_started",
    submitted_at: null,
    expectedTier: "green",
    final_text: "",
    iterations: [],
  },
];

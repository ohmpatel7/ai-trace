-- AI Trace schema. Plain SQL so the shape of the data is easy to read in the report.
-- analysis_results is a cache of what lib/analysis.ts computes from submissions and
-- iterations. It is always recomputable and never edited by hand.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  upi TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'grader'))
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  semester TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enrolments (
  user_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  role TEXT NOT NULL CHECK (role IN ('student', 'grader')),
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  lane INTEGER NOT NULL CHECK (lane IN (1, 2)),
  instructions TEXT NOT NULL,
  due_at TEXT NOT NULL,
  expected_min_iterations INTEGER NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  final_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted')),
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS iterations (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  ai_output TEXT NOT NULL,
  critique TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN ('accepted', 'edited', 'rejected', 'verified_elsewhere')),
  action_note TEXT NOT NULL DEFAULT '',
  -- Where in the work the step sat (Explore, Check claim, Revise), from the team's dataset.
  stage TEXT NOT NULL DEFAULT '',
  -- The dataset's scenario tag for a seeded step. Test metadata only; never shown as a finding.
  scenario_tag TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis_results (
  submission_id INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  computed_at TEXT NOT NULL,
  config_json TEXT NOT NULL,
  overlap_pct INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('green', 'amber', 'red')),
  covered_words INTEGER NOT NULL,
  total_words INTEGER NOT NULL,
  bridged_words INTEGER NOT NULL,
  spans_json TEXT NOT NULL,
  critique_json TEXT NOT NULL
);

-- LLM reflection check results, one per step. Advisory and recomputable; never part of the student's record.
CREATE TABLE IF NOT EXISTS llm_reviews (
  iteration_id INTEGER PRIMARY KEY REFERENCES iterations(id) ON DELETE CASCADE,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('considered', 'look_closer')),
  reason TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  checked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grader_reviews (
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  grader_id INTEGER NOT NULL REFERENCES users(id),
  reviewed INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (submission_id, grader_id)
);

-- ============================================
-- USERS & AUTH
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telegram_id TEXT,
  role TEXT NOT NULL DEFAULT 'student',  -- student, admin, mentor, instructor
  joined_at INTEGER NOT NULL
);

-- ============================================
-- ACADEMY: COURSES
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  level TEXT NOT NULL,
  path TEXT NOT NULL,
  weeks INTEGER NOT NULL,
  price INTEGER NOT NULL,
  hue TEXT NOT NULL,
  icon TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcomes TEXT NOT NULL,
  skills TEXT NOT NULL,
  channel TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  tags TEXT NOT NULL,
  bullets TEXT NOT NULL,
  msg INTEGER NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL REFERENCES courses(id),
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  answer INTEGER NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  enrolled_at INTEGER NOT NULL,
  quiz_score INTEGER,
  quiz_total INTEGER,
  quiz_passed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS lesson_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  completed_at INTEGER NOT NULL,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  at INTEGER NOT NULL,
  text TEXT NOT NULL,
  kind TEXT NOT NULL
);

-- ============================================
-- MENTORSHIP SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  specialties TEXT NOT NULL,
  hourly_rate INTEGER,
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS instructors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS course_instructors (
  course_id TEXT NOT NULL REFERENCES courses(id),
  instructor_id TEXT NOT NULL REFERENCES instructors(id),
  PRIMARY KEY (course_id, instructor_id)
);

CREATE TABLE IF NOT EXISTS mentorship_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mentorship_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  mentor_id TEXT REFERENCES mentors(id),
  category_id TEXT REFERENCES mentorship_categories(id),
  custom_category TEXT,
  goals TEXT NOT NULL,
  experience TEXT NOT NULL,
  availability TEXT NOT NULL,
  preferred_format TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  proposed_price INTEGER,
  agreed_price INTEGER,
  payment_status TEXT DEFAULT 'not_applicable',
  applied_at INTEGER NOT NULL,
  agreed_at INTEGER,
  start_date INTEGER,
  end_date INTEGER,
  notes TEXT,
  review_notes TEXT,
  reviewed_at INTEGER,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS counseling_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  mentor_id TEXT REFERENCES mentors(id),
  topic TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL,
  meeting_link TEXT,
  location TEXT,
  scheduled_at INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meetups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mentor_id TEXT REFERENCES mentors(id),
  format TEXT NOT NULL,
  meeting_link TEXT,
  location TEXT,
  scheduled_at INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  max_attendees INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meetup_attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meetup_id TEXT NOT NULL REFERENCES meetups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'going',
  rsvp_at INTEGER NOT NULL,
  UNIQUE(meetup_id, user_id)
);

CREATE TABLE IF NOT EXISTS telegram_community (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  group_id TEXT,
  group_username TEXT,
  channel_id TEXT,
  channel_username TEXT,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_course ON quiz_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_user ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON mentorship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON mentorship_applications(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON counseling_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meetups_scheduled ON meetups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_attendees_meetup ON meetup_attendees(meetup_id);
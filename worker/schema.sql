-- ============================================
-- USERS & AUTH
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telegram_id TEXT,
  role TEXT NOT NULL DEFAULT 'student',  -- student, admin, mentor, instructor
  password_hash TEXT,
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
  price_usd INTEGER DEFAULT 0,
  hue TEXT NOT NULL,
  icon TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcomes TEXT NOT NULL,
  skills TEXT NOT NULL,
  channel TEXT NOT NULL,
  category TEXT DEFAULT 'General',
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
  youtube_url TEXT,
  unlock_date INTEGER,
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
  weeks_unlocked INTEGER DEFAULT 0,
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
-- PAYMENTS & INSTALLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  course_id TEXT REFERENCES courses(id),
  reference TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_plan TEXT DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'pending',
  proof_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  course_id TEXT REFERENCES courses(id),
  payment_id TEXT REFERENCES payments(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  proof_url TEXT,
  telegram_chat_id TEXT,
  due_date INTEGER,
  reminder_sent INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- ============================================
-- BOT SESSIONS & ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS bot_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  user_id TEXT,
  purpose TEXT NOT NULL,
  reference TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assignment_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  assignment_id TEXT NOT NULL REFERENCES assignments(id),
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at INTEGER,
  UNIQUE(user_id, assignment_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT,
  file_url TEXT,
  submitted_at INTEGER NOT NULL
);

-- ============================================
-- RESOURCES & BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  course_id TEXT REFERENCES courses(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes INTEGER,
  metadata TEXT,
  access_level TEXT DEFAULT 'enrolled',
  order_index INTEGER DEFAULT 0,
  source_type TEXT DEFAULT 'external',
  key TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  issued_at INTEGER NOT NULL,
  UNIQUE(user_id, course_id)
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
  image_url TEXT,
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
-- AUDIT & RATE LIMITS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,
  timestamp INTEGER NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_installments_user ON installments(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_telegram ON bot_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lesson ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignment_status_user ON assignment_status(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_lesson ON resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
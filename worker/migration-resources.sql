-- Universal resources table
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- video_youtube, video_r2, document_pdf, link_drive, etc.
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes INTEGER,
  metadata TEXT,  -- JSON: {pages, resolution, format, etc.}
  access_level TEXT NOT NULL DEFAULT 'enrolled',  -- 'public', 'enrolled', 'premium'
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_lesson ON resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);

-- Optional: remove old youtube_url column (or keep for backward compat)
-- ALTER TABLE lessons DROP COLUMN youtube_url;  -- SQLite doesn't support DROP COLUMN in older versions, so we'll just ignore it

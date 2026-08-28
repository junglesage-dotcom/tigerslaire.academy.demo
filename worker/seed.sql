-- ============================================
-- COURSES (PY101, BA202, EH301)
-- ============================================
INSERT INTO courses (id, code, title, tagline, level, path, weeks, price, hue, icon, summary, outcomes, skills, channel, created_at) VALUES
('py101', 'PY101', 'Python for Data Analysis', 'From zero syntax to cleaning, analysing and visualising real Nigerian datasets.', 'Beginner', 'Beginner → Intermediate', 8, 45000, '#ffa41b', 'python', 'Eight weeks of practical Python built around data you recognise.', '["Write confident Python","Load, clean and reshape messy CSVs","Group, merge and aggregate datasets","Tell the story with Matplotlib charts","Ship a capstone analysis"]', '["Python 3","NumPy","Pandas","Matplotlib","CSV wrangling"]', 't.me/lair_py101', strftime('%s','now')),
('ba202', 'BA202', 'Business Analysis Essentials', 'Turn vague business problems into requirements, models and decisions people act on.', 'Beginner', 'Beginner → Job-ready', 6, 38000, '#57d9a3', 'business', 'A six-week foundation for aspiring business analysts.', '["Run stakeholder interviews","Apply SWOT, PESTLE and process mapping","Pick KPIs that change decisions","Structure findings into stories","Deliver a full case-study analysis"]', '["Requirements","SWOT/PESTLE","Process mapping","KPIs","Data storytelling"]', 't.me/lair_ba202', strftime('%s','now')),
('eh301', 'EH301', 'Ethical Hacking Foundations', 'Recon, scanning and web fundamentals — practised legally, reported professionally.', 'Intermediate', 'Intermediate → Practitioner', 10, 60000, '#ff6b3d', 'shield', 'Ten disciplined weeks inside a safe lab.', '["Explain how the internet works","Drive Linux from the command line","Run structured recon and Nmap scans","Understand the OWASP top 10","Write a professional findings report"]', '["Linux","Networking","Nmap","OSINT","OWASP","Reporting"]', 't.me/lair_eh301', strftime('%s','now'));

-- PY101 modules & lessons (abbreviated — add all 12 lessons similarly)
INSERT INTO modules (course_id, title, order_index) VALUES
('py101', 'Python foundations', 1),
('py101', 'Working with data', 2),
('py101', 'Pandas, properly', 3),
('py101', 'Analysis in practice', 4),
('ba202', 'Thinking like an analyst', 5),
('ba202', 'Models that earn their keep', 6),
('ba202', 'Communication & delivery', 7),
('eh301', 'Groundwork', 8),
('eh301', 'The offensive toolkit', 9),
('eh301', 'Practice & professionalism', 10);

-- Sample lessons (add all 30 lessons from the original courses.ts following this pattern)
INSERT INTO lessons (id, module_id, course_id, title, minutes, tags, bullets, msg, order_index) VALUES
('py-01', 1, 'py101', 'Introduction & environment setup', 18, '["Video","PDF"]', '["Installing Python, VS Code and Jupyter","How the lair workflow runs"]', 301, 1),
('py-02', 1, 'py101', 'Variables & data types', 26, '["Video","PDF","Assignment"]', '["Strings, numbers, booleans","f-strings and readable code"]', 306, 2),
('py-03', 1, 'py101', 'Control flow & loops', 32, '["Video","Code"]', '["if / elif / else without spaghetti","for and while loops"]', 312, 3);
-- ... continue for all 30 lessons

-- Sample quiz questions
INSERT INTO quiz_questions (course_id, question, options, answer, order_index) VALUES
('py101', 'Which structure does Pandas use for a labelled 2-D table?', '["Array","DataFrame","Dictionary","Tensor"]', 1, 1),
('py101', 'What does df.groupby(''region'')[''sales''].mean() return?', '["Total sales","Filtered DataFrame","Mean sales per region","Sorted list"]', 2, 2);
-- ... continue for all quiz questions

-- ============================================
-- MENTORSHIP CATEGORIES
-- ============================================
INSERT INTO mentorship_categories (id, name, description, is_custom, created_at) VALUES
('tech', 'Tech Mentorship', 'Coding, data analysis, cybersecurity, software development, and technical career guidance.', 0, strftime('%s','now')),
('life-skills', 'Life Skills', 'Productivity, time management, communication, decision-making, and personal effectiveness.', 0, strftime('%s','now')),
('digital-therapy', 'Digital Therapy', 'Digital wellness, screen time management, online habits, and healthy tech relationships.', 0, strftime('%s','now')),
('life-coaching', 'Life Coaching', 'Goal setting, career transitions, personal growth, and life direction.', 0, strftime('%s','now')),
('custom', 'Custom Mentorship', 'Describe your specific needs and goals. We will match you with the right mentor.', 1, strftime('%s','now'));

-- ============================================
-- TELEGRAM COMMUNITY (placeholder)
-- ============================================
INSERT INTO telegram_community (id, updated_at) VALUES (1, strftime('%s','now'));
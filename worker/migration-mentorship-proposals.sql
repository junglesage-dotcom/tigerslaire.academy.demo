-- Expanded mentorship proposal workflow:
-- lets an admin/mentor attach mentor, first-session date, and a personal note
-- to a proposal (stored via the PUT /api/mentorship/application/:id/propose endpoint).

ALTER TABLE mentorship_applications ADD COLUMN review_notes TEXT;
ALTER TABLE mentorship_applications ADD COLUMN reviewed_at INTEGER;
ALTER TABLE mentorship_applications ADD COLUMN reviewed_by TEXT;
-- Existing rows will have NULL for the new columns until a proposal is sent.

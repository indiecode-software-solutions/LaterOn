-- LaterOn Phase 2: Personal Reminders Table

CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurrence VARCHAR(50) DEFAULT 'none',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
ON reminders FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_status
ON reminders (user_id, status);
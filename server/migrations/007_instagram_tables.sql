-- ============================================================
-- 007: Instagram Integration Tables
-- ============================================================

-- Scheduled Instagram posts (images only, single or carousel)
CREATE TABLE IF NOT EXISTS instagram_posts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption         TEXT,
  image_urls      TEXT[]   NOT NULL,
  post_type       VARCHAR(20) DEFAULT 'IMAGE',
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) DEFAULT 'scheduled',
  ig_post_id      TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own instagram posts"
  ON instagram_posts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_pending
  ON instagram_posts (user_id, status, scheduled_at);

-- Auto-reply rules for DMs and Comments
CREATE TABLE IF NOT EXISTS instagram_auto_rules (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type       VARCHAR(20) NOT NULL,
  trigger_type    VARCHAR(20) NOT NULL,
  trigger_keyword TEXT,
  reply_message   TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE instagram_auto_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own instagram auto rules"
  ON instagram_auto_rules FOR ALL USING (auth.uid() = user_id);

-- Track which DMs/comments have already been auto-replied to
CREATE TABLE IF NOT EXISTS instagram_replied_ids (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id      TEXT NOT NULL,
  replied_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

ALTER TABLE instagram_replied_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own replied ids"
  ON instagram_replied_ids FOR ALL USING (auth.uid() = user_id);

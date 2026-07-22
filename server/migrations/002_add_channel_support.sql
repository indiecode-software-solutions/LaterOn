-- LaterOn Phase 2: Multi-Channel Support Migration

-- 1. Add channel support to schedules table
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS email_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);

-- Create index for faster background worker queries
CREATE INDEX IF NOT EXISTS idx_schedules_pending_channel 
ON schedules (status, scheduled_at, channel);

-- 2. User integrations table for storing OAuth tokens and API keys
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  email_address VARCHAR(255),
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'connected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own integrations" 
ON user_integrations 
FOR ALL 
USING (auth.uid() = user_id);

-- Enable realtime for user_integrations
ALTER PUBLICATION supabase_realtime ADD TABLE user_integrations;

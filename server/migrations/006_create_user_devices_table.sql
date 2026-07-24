-- LaterOn: User Devices for Push Notification Architecture

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  device_type VARCHAR(20) NOT NULL, -- 'android', 'ios', 'web'
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices"
ON user_devices FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);

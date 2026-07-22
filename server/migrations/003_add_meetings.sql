-- 1. Add metadata JSONB column to schedules for meeting-specific fields
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create meeting_types table for reusable meeting templates
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  duration INT DEFAULT 30,
  platform VARCHAR(50) DEFAULT 'google_meet',
  custom_location TEXT,
  notify_whatsapp BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  reminder_timing VARCHAR(50) DEFAULT '24h',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create bookings table for client bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_url TEXT,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_meeting_types_user_id ON meeting_types (user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_types_slug ON meeting_types (slug);
CREATE INDEX IF NOT EXISTS idx_bookings_meeting_type_id ON bookings (meeting_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings (start_time);

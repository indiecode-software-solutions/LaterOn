-- 1. Add credit tracking columns to schedules table to store deduction history
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS credits_charged INTEGER DEFAULT 5;

-- 2. Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_balance INTEGER DEFAULT 500 NOT NULL,
  purchased_balance INTEGER DEFAULT 0 NOT NULL,
  last_refill_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  next_refill_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month') NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credits"
ON user_credits FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deduction', 'refund', 'monthly_refill', 'purchase')),
  description TEXT,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions"
ON credit_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE credit_transactions;

-- 4. Create trigger to automatically insert a user_credits record when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, free_balance, purchased_balance, last_refill_date, next_refill_date)
  VALUES (NEW.id, 500, 0, NOW(), NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Backfill credits table for existing users
INSERT INTO public.user_credits (user_id, free_balance, purchased_balance, last_refill_date, next_refill_date)
SELECT id, 500, 0, NOW(), NOW() + INTERVAL '1 month'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

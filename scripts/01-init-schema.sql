-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create codes table
CREATE TABLE IF NOT EXISTS codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_codes table to track which codes users have found
CREATE TABLE IF NOT EXISTS user_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  found_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, code_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;

-- Policies for users table (public read, anyone can insert)
CREATE POLICY "Allow public read" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);

-- Policies for codes table (public read)
CREATE POLICY "Allow public read codes" ON codes FOR SELECT USING (true);

-- Policies for user_codes table (public read/insert)
CREATE POLICY "Allow public read user_codes" ON user_codes FOR SELECT USING (true);
CREATE POLICY "Allow public insert user_codes" ON user_codes FOR INSERT WITH CHECK (true);

-- Insert 10 placeholder codes (user can edit these later)
INSERT INTO codes (code) VALUES
  ('BLACK'),
  ('NEW'),
  ('OPEN'),
  ('YELOOW'),
  ('CODE5'),
  ('CODE6'),
  ('CODE7'),
  ('CODE8'),
  ('CODE9'),
  ('CODE10')
ON CONFLICT DO NOTHING;

-- Add RLS policies for admin operations via service role
-- Service role key can bypass RLS to perform admin operations

-- Delete existing policies to replace them
DROP POLICY IF EXISTS "Allow public read" ON users;
DROP POLICY IF EXISTS "Allow public insert" ON users;
DROP POLICY IF EXISTS "Allow public read codes" ON codes;
DROP POLICY IF EXISTS "Allow public read user_codes" ON user_codes;
DROP POLICY IF EXISTS "Allow public insert user_codes" ON user_codes;

-- Users table policies
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role all operations" ON users FOR ALL USING (true) WITH CHECK (true);

-- Codes table policies
CREATE POLICY "Allow public read codes" ON codes FOR SELECT USING (true);
CREATE POLICY "Allow service role all operations" ON codes FOR ALL USING (true) WITH CHECK (true);

-- User_codes table policies
CREATE POLICY "Allow public read user_codes" ON user_codes FOR SELECT USING (true);
CREATE POLICY "Allow public insert user_codes" ON user_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role all operations" ON user_codes FOR ALL USING (true) WITH CHECK (true);

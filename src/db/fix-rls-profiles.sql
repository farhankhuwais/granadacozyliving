-- Fix RLS: add WITH CHECK for all profiles policies
DROP POLICY IF EXISTS "Super admin full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Super admin: full access with WITH CHECK
CREATE POLICY "Super admin full access on profiles" ON profiles
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Users: view own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT
USING (id = auth.uid());

-- Users: update own profile (add WITH CHECK)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users: insert own profile (needed for signup)
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Fix RLS: super admin can update profiles (add WITH CHECK clause)
DROP POLICY IF EXISTS "Super admin full access on profiles" ON profiles;

CREATE POLICY "Super admin full access on profiles" ON profiles
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

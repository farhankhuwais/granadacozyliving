-- Fix: SECURITY DEFINER functions to prevent RLS infinite recursion
-- Execute this in Supabase SQL Editor

-- Helper function: check if user is super admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Helper function: check if user has manager role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_manager_role()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager')
  );
$$;

-- Helper function: check if user has investor role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_investor_role()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('investor_only', 'investor_manager')
  );
$$;

-- Helper function: get user's property_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_property_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT property_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Disable all existing RLS policies on profiles FIRST
DROP POLICY IF EXISTS "Super admin full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Re-create profiles policies WITHOUT recursion
CREATE POLICY "Super admin full access on profiles" ON profiles FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
USING (id = auth.uid());

-- Re-create policies on other tables to use helper functions

-- Properties
DROP POLICY IF EXISTS "Super admin full access on properties" ON properties;
DROP POLICY IF EXISTS "Users can view own property" ON properties;

CREATE POLICY "Super admin full access on properties" ON properties FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own property" ON properties FOR SELECT
USING (id = public.user_property_id());

-- Rooms
DROP POLICY IF EXISTS "Super admin full access on rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view own property rooms" ON rooms;
DROP POLICY IF EXISTS "Manager can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Manager can update rooms" ON rooms;

CREATE POLICY "Super admin full access on rooms" ON rooms FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own property rooms" ON rooms FOR SELECT
USING (property_id = public.user_property_id());

CREATE POLICY "Manager can insert rooms" ON rooms FOR INSERT
WITH CHECK (property_id = public.user_property_id() AND public.has_manager_role());

CREATE POLICY "Manager can update rooms" ON rooms FOR UPDATE
USING (property_id = public.user_property_id() AND public.has_manager_role());

-- Room photos
DROP POLICY IF EXISTS "Super admin full access on room_photos" ON room_photos;
DROP POLICY IF EXISTS "Users can view own property room photos" ON room_photos;
DROP POLICY IF EXISTS "Manager can upload room photos" ON room_photos;

CREATE POLICY "Super admin full access on room_photos" ON room_photos FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own property room photos" ON room_photos FOR SELECT
USING (room_id IN (SELECT id FROM rooms WHERE property_id = public.user_property_id()));

CREATE POLICY "Manager can upload room photos" ON room_photos FOR INSERT
WITH CHECK (public.has_manager_role() AND room_id IN (SELECT id FROM rooms WHERE property_id = public.user_property_id()));

-- Tenants
DROP POLICY IF EXISTS "Super admin full access on tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view own property tenants" ON tenants;
DROP POLICY IF EXISTS "Manager can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Manager can update tenants" ON tenants;
DROP POLICY IF EXISTS "Manager can delete tenants" ON tenants;

CREATE POLICY "Super admin full access on tenants" ON tenants FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own property tenants" ON tenants FOR SELECT
USING (room_id IN (SELECT id FROM rooms WHERE property_id = public.user_property_id()));

CREATE POLICY "Manager can insert tenants" ON tenants FOR INSERT
WITH CHECK (public.has_manager_role() AND room_id IN (SELECT id FROM rooms WHERE property_id = public.user_property_id()));

CREATE POLICY "Manager can update tenants" ON tenants FOR UPDATE
USING (public.has_manager_role() AND room_id IN (SELECT id FROM rooms WHERE property_id = public.user_property_id()));

CREATE POLICY "Manager can delete tenants" ON tenants FOR DELETE
USING (public.has_manager_role() AND room_id IN (SELECT id FROM rooms WHERE property_id = public.user_property_id()));

-- Transactions
DROP POLICY IF EXISTS "Super admin full access on transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own property transactions" ON transactions;
DROP POLICY IF EXISTS "Manager can insert transactions" ON transactions;

CREATE POLICY "Super admin full access on transactions" ON transactions FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own property transactions" ON transactions FOR SELECT
USING (property_id = public.user_property_id());

CREATE POLICY "Manager can insert transactions" ON transactions FOR INSERT
WITH CHECK (public.has_manager_role() AND property_id = public.user_property_id());

-- Requests
DROP POLICY IF EXISTS "Super admin full access on requests" ON requests;
DROP POLICY IF EXISTS "Users can view own property requests" ON requests;
DROP POLICY IF EXISTS "Manager can insert requests" ON requests;
DROP POLICY IF EXISTS "Manager can update requests" ON requests;
DROP POLICY IF EXISTS "Investor can approve requests" ON requests;

CREATE POLICY "Super admin full access on requests" ON requests FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own property requests" ON requests FOR SELECT
USING (property_id = public.user_property_id());

CREATE POLICY "Manager can insert requests" ON requests FOR INSERT
WITH CHECK (public.has_manager_role() AND property_id = public.user_property_id());

CREATE POLICY "Manager can update requests" ON requests FOR UPDATE
USING (public.has_manager_role() AND property_id = public.user_property_id());

CREATE POLICY "Investor can approve requests" ON requests FOR UPDATE
USING (public.has_investor_role() AND property_id = public.user_property_id());

-- Request photos
DROP POLICY IF EXISTS "Super admin full access on request_photos" ON request_photos;
DROP POLICY IF EXISTS "Users can view own property request photos" ON request_photos;
DROP POLICY IF EXISTS "Manager can upload request photos" ON request_photos;

CREATE POLICY "Super admin full access on request_photos" ON request_photos FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own property request photos" ON request_photos FOR SELECT
USING (request_id IN (SELECT id FROM requests WHERE property_id = public.user_property_id()));

CREATE POLICY "Manager can upload request photos" ON request_photos FOR INSERT
WITH CHECK (public.has_manager_role() AND request_id IN (SELECT id FROM requests WHERE property_id = public.user_property_id()));

-- RLS Policies for Cozy Living by Granada
-- Using Context7 best practices: auth.uid() pattern

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_photos ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- PROPERTIES TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on properties"
ON properties FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view own property
CREATE POLICY "Users can view own property"
ON properties FOR SELECT
USING (
  id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- ROOMS TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on rooms"
ON rooms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view rooms from own property
CREATE POLICY "Users can view own property rooms"
ON rooms FOR SELECT
USING (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- Manager can insert rooms
CREATE POLICY "Manager can insert rooms"
ON rooms FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid() AND role LIKE '%manager%'
  )
);

-- Manager can update rooms
CREATE POLICY "Manager can update rooms"
ON rooms FOR UPDATE
USING (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid() AND role LIKE '%manager%'
  )
);

-- ROOM_PHOTOS TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on room_photos"
ON room_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view photos from own property
CREATE POLICY "Users can view own property room photos"
ON room_photos FOR SELECT
USING (
  room_id IN (
    SELECT id FROM rooms
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid()
    )
  )
);

-- Manager can upload room photos
CREATE POLICY "Manager can upload room photos"
ON room_photos FOR INSERT
WITH CHECK (
  room_id IN (
    SELECT id FROM rooms
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid() AND role LIKE '%manager%'
    )
  )
);

-- TENANTS TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on tenants"
ON tenants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view tenants from own property
CREATE POLICY "Users can view own property tenants"
ON tenants FOR SELECT
USING (
  room_id IN (
    SELECT id FROM rooms
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid()
    )
  )
);

-- Manager can insert tenants
CREATE POLICY "Manager can insert tenants"
ON tenants FOR INSERT
WITH CHECK (
  room_id IN (
    SELECT id FROM rooms
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid() AND role LIKE '%manager%'
    )
  )
);

-- Manager can update tenants
CREATE POLICY "Manager can update tenants"
ON tenants FOR UPDATE
USING (
  room_id IN (
    SELECT id FROM rooms
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid() AND role LIKE '%manager%'
    )
  )
);

-- Manager can delete tenants (soft delete)
CREATE POLICY "Manager can delete tenants"
ON tenants FOR DELETE
USING (
  room_id IN (
    SELECT id FROM rooms
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid() AND role LIKE '%manager%'
    )
  )
);

-- TRANSACTIONS TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on transactions"
ON transactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view transactions from own property
CREATE POLICY "Users can view own property transactions"
ON transactions FOR SELECT
USING (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- Manager can insert transactions
CREATE POLICY "Manager can insert transactions"
ON transactions FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid() AND role LIKE '%manager%'
  )
);

-- REQUESTS TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on requests"
ON requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view requests from own property
CREATE POLICY "Users can view own property requests"
ON requests FOR SELECT
USING (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- Manager can insert requests
CREATE POLICY "Manager can insert requests"
ON requests FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid() AND role LIKE '%manager%'
  )
);

-- Manager can update request status
CREATE POLICY "Manager can update requests"
ON requests FOR UPDATE
USING (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid() AND role LIKE '%manager%'
  )
);

-- Investor can approve/reject requests
CREATE POLICY "Investor can approve requests"
ON requests FOR UPDATE
USING (
  property_id IN (
    SELECT property_id FROM profiles
    WHERE id = auth.uid() AND role LIKE '%investor%'
  )
);

-- REQUEST_PHOTOS TABLE POLICIES
-- Super admin: full access
CREATE POLICY "Super admin full access on request_photos"
ON request_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can view request photos from own property
CREATE POLICY "Users can view own property request photos"
ON request_photos FOR SELECT
USING (
  request_id IN (
    SELECT id FROM requests
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid()
    )
  )
);

-- Manager can upload request photos
CREATE POLICY "Manager can upload request photos"
ON request_photos FOR INSERT
WITH CHECK (
  request_id IN (
    SELECT id FROM requests
    WHERE property_id IN (
      SELECT property_id FROM profiles
      WHERE id = auth.uid() AND role LIKE '%manager%'
    )
  )
);

-- Chunk 3/3: RLS Policies (FIXED - ENUM comparison fix)
-- Execute this after Chunk 2 succeeds

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Super admin full access on profiles" ON profiles FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
USING (id = auth.uid());

-- Properties policies
CREATE POLICY "Super admin full access on properties" ON properties FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own property" ON properties FOR SELECT
USING (id IN (SELECT property_id FROM profiles WHERE id = auth.uid()));

-- Rooms policies
CREATE POLICY "Super admin full access on rooms" ON rooms FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own property rooms" ON rooms FOR SELECT
USING (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manager can insert rooms" ON rooms FOR INSERT
WITH CHECK (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager')));
CREATE POLICY "Manager can update rooms" ON rooms FOR UPDATE
USING (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager')));

-- Room photos policies
CREATE POLICY "Super admin full access on room_photos" ON room_photos FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own property room photos" ON room_photos FOR SELECT
USING (room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Manager can upload room photos" ON room_photos FOR INSERT
WITH CHECK (room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager'))));

-- Tenants policies
CREATE POLICY "Super admin full access on tenants" ON tenants FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own property tenants" ON tenants FOR SELECT
USING (room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Manager can insert tenants" ON tenants FOR INSERT
WITH CHECK (room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager'))));
CREATE POLICY "Manager can update tenants" ON tenants FOR UPDATE
USING (room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager'))));
CREATE POLICY "Manager can delete tenants" ON tenants FOR DELETE
USING (room_id IN (SELECT id FROM rooms WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager'))));

-- Transactions policies
CREATE POLICY "Super admin full access on transactions" ON transactions FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own property transactions" ON transactions FOR SELECT
USING (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manager can insert transactions" ON transactions FOR INSERT
WITH CHECK (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager')));

-- Requests policies
CREATE POLICY "Super admin full access on requests" ON requests FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own property requests" ON requests FOR SELECT
USING (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manager can insert requests" ON requests FOR INSERT
WITH CHECK (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager')));

-- Manager update requests (status: proses, selesai)
CREATE POLICY "Manager can update requests" ON requests FOR UPDATE
USING (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager')));

-- Investor can approve/reject requests
CREATE POLICY "Investor can approve requests" ON requests FOR UPDATE
USING (property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('investor_only', 'investor_manager')));

-- Request photos policies
CREATE POLICY "Super admin full access on request_photos" ON request_photos FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can view own property request photos" ON request_photos FOR SELECT
USING (request_id IN (SELECT id FROM requests WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Manager can upload request photos" ON request_photos FOR INSERT
WITH CHECK (request_id IN (SELECT id FROM requests WHERE property_id IN (SELECT property_id FROM profiles WHERE id = auth.uid() AND role IN ('manager_only', 'investor_manager'))));

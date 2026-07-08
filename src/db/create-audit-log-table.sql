CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_label TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index buat filtering cepat
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Auto-hapus log > 90 hari (panggil via cron nanti)
-- DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Super admin bisa lihat semua, user lain gak bisa
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_audit_logs"
  ON audit_logs FOR ALL
  USING (is_super_admin() = true)
  WITH CHECK (is_super_admin() = true);

CREATE POLICY "insert_own_audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

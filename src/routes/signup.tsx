import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileLayout from "@/components/MobileLayout";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UserRole = "investor_only" | "manager_only" | "investor_manager";

interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("investor_only");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [success]);

  async function fetchUsers() {
    setLoadingUsers(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .neq("role", "super_admin")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoadingUsers(false);
  }

  async function handleDeleteUser(id: string, email: string) {
    if (!confirm(`Hapus akun ${email}?`)) return;
    // Delete profile + auth user (profile cascade)
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    alert("Akun dihapus");
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Use signUp instead of admin.createUser (admin API requires service_role key server-side)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      const { data: propertyData } = await supabase
        .from("properties")
        .select("id")
        .limit(1)
        .single();

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role,
        property_id: propertyData?.id || null,
      });

      if (profileError) {
        setError(profileError.message);
      } else {
        setSuccess(
          `Akun ${email} berhasil dibuat sebagai ${role}. ${
            !data.session
              ? "User perlu konfirmasi email sebelum login."
              : "User sudah bisa login sekarang."
          }`
        );
        setEmail("");
        setPassword("");
        setFullName("");
      }
    }

    setLoading(false);
  }

  return (
    <ProtectedRoute roles={["super_admin"]}>
      <MobileLayout>
        <div className="px-5 pt-12 pb-6">
          <button onClick={() => navigate("/profil")} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Profil
          </button>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">Buat Akun Baru</h1>
            <p className="mt-1 text-sm text-muted-foreground">Super Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="investor_only">Investor</option>
                <option value="manager_only">Manager</option>
                <option value="investor_manager">Investor + Manager</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-success text-center">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Buat Akun"}
            </button>
          </form>
        </div>

        {/* User list */}
        <div className="px-5 pb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Riwayat Akun ({users.length})</h3>
          <div className="mb-3 flex gap-2">
            <input type="text" value={searchUser} onChange={e => setSearchUser(e.target.value)}
              placeholder="Cari nama/email..."
              className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground">
              <option value="">Semua</option>
              <option value="investor_only">Investor</option>
              <option value="manager_only">Manager</option>
              <option value="investor_manager">Investor+Manager</option>
            </select>
          </div>
          {loadingUsers ? (
            <p className="text-xs text-muted-foreground">Memuat...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada akun</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {users
                .filter(u => {
                  if (filterRole && u.role !== filterRole) return false;
                  if (!searchUser.trim()) return true;
                  const q = searchUser.toLowerCase();
                  return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                })
                .map(u => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{u.full_name || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{u.email} · {u.role.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[9px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString("id-ID")}</span>
                    <button onClick={() => handleDeleteUser(u.id, u.email)} className="text-muted-foreground hover:text-destructive transition-colors" title="Hapus">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileLayout>
    </ProtectedRoute>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";

type UserRole =
  | "investor_only"
  | "manager_only"
  | "investor_manager";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("investor_only");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role,
        property_id: (await supabase.from("properties").select("id").limit(1).single()).data?.id || null,
      });

      if (profileError) {
        setError(profileError.message);
      } else {
        setSuccess(`Akun ${email} berhasil dibuat sebagai ${role}`);
        setEmail("");
        setPassword("");
        setFullName("");
      }
    }

    setLoading(false);
  }

  return (
    <ProtectedRoute roles={["super_admin"]}>
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Buat Akun Baru</h1>
            <p className="mt-1 text-sm text-gray-400">Super Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-blue-600 focus:outline-none"
              >
                <option value="investor_only">Investor</option>
                <option value="manager_only">Manager</option>
                <option value="investor_manager">Investor + Manager</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-400 text-center">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Buat Akun"}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type UserRole = "investor_only" | "manager_only" | "investor_manager";

export default function CreateUserForm() {
  const { profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("investor_only");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (profile?.role !== "super_admin") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
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
          `Akun ${email} berhasil dibuat sebagai ${role.replace("_", " ")}. ${
            !data.session ? "User perlu konfirmasi email." : "User sudah bisa login."
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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Buat Akun Baru</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nama lengkap"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" required />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8 karakter)"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" required minLength={8} />
        <select value={role} onChange={e => setRole(e.target.value as UserRole)}
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="investor_only">Investor</option>
          <option value="manager_only">Manager</option>
          <option value="investor_manager">Investor + Manager</option>
        </select>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Memproses..." : "Buat Akun"}
        </button>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Masukkan email terlebih dahulu");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setError("Email reset password terkirim. Cek inbox Anda.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Cozy Living</h1>
          <p className="mt-1 text-sm text-gray-400">by Granada</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cozyliving.com"
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Lupa password?
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const hasToken = hash && hash.includes("access_token");
    if (hasToken) {
      supabase.auth
        .setSession({
          access_token: hash.split("access_token=")[1]?.split("&")[0] || "",
          refresh_token: "",
        })
        .then(({ error }) => {
          if (!error) setTokenValid(true);
          else setError("Token reset tidak valid atau sudah kadaluarsa.");
        });
    } else {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (!error) setTokenValid(true);
          else setError("Token reset tidak valid.");
        });
      } else {
        setError("Tidak ada token reset. Gunakan link dari email.");
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-600/20">
            <span className="text-2xl text-green-400">✓</span>
          </div>
          <h1 className="text-xl font-bold text-white">Password Diubah</h1>
          <p className="mt-2 text-sm text-gray-400">
            Password berhasil diperbarui. Silakan login dengan password baru.
          </p>
          <a
            href="/"
            className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="mt-1 text-sm text-gray-400">
            Masukkan password baru
          </p>
        </div>

        {!tokenValid && !error && (
          <div className="flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          </div>
        )}

        {error && !tokenValid && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {tokenValid && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Password Baru
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
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                required
                minLength={8}
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
              {loading ? "Memproses..." : "Simpan Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

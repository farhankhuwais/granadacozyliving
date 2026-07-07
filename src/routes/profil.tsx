import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProperties } from "@/hooks/use-properties";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { Link } from "react-router-dom";
import { User, Building2, BedDouble, TrendingUp, LogOut, Pencil, Check, X, Shield } from "lucide-react";

export default function ProfilPage() {
  const { profile, signOut, updateProfile, updateEmail, updatePassword, refreshProfile } = useAuth();
  const [propertyName, setPropertyName] = useState("");
  const [editing, setEditing] = useState<"name" | "email" | "password" | null>(null);
  const [editVal, setEditVal] = useState("");
  const [editVal2, setEditVal2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingProperty, setEditingProperty] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [propSaving, setPropSaving] = useState(false);
  const { data: allProperties } = useProperties();

  useEffect(() => {
    if (!profile?.propertyId) { setPropertyName("—"); return; }
    (async () => {
      const { data } = await supabase.from("properties").select("name, location").eq("id", profile.propertyId).single();
      setPropertyName(data?.name || "—");
      setPropertyLocation(data?.location || "");
    })();
  }, [profile?.propertyId]);

  async function handleSaveProperty() {
    if (!editPropertyId) return;
    setPropSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ property_id: editPropertyId }).eq("id", profile?.id);
      if (error) throw error;
      const prop = allProperties?.find(p => p.id === editPropertyId);
      setPropertyName(prop?.name || "—");
      setPropertyLocation(prop?.location || "");
      setEditingProperty(false);
      await refreshProfile();
      setMsg("Properti berhasil diubah");
      setMsgOk(true);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Gagal");
      setMsgOk(false);
    }
    setPropSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleSaveName() {
    if (!editVal.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ full_name: editVal.trim() });
      setMsg("Nama berhasil diubah");
      setMsgOk(true);
      setEditing(null);
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Gagal"); setMsgOk(false); }
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleSaveEmail() {
    if (!editVal.trim()) return;
    setLoading(true);
    try {
      await updateEmail(editVal.trim());
      setMsg("Email verifikasi dikirim ke email baru.");
      setMsgOk(true);
      setEditing(null);
    } catch (e: unknown) { setMsg(`Gagal: ${e instanceof Error ? e.message : String(e)}`); setMsgOk(false); }
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleSavePassword() {
    if (editVal.length < 8) { setMsg("Password minimal 8 karakter"); setMsgOk(false); return; }
    if (editVal !== editVal2) { setMsg("Password tidak cocok"); setMsgOk(false); return; }
    setLoading(true);
    try {
      await updatePassword(editVal);
      setMsg("Password berhasil diubah");
      setMsgOk(true);
      setEditing(null);
      setEditVal("");
      setEditVal2("");
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Gagal"); setMsgOk(false); }
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleUploadAvatar(file: File) {
    if (!profile?.id) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${profile.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("room-photos").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("room-photos").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", profile.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
      setMsg("Foto profil diubah");
      setMsgOk(true);
      setTimeout(() => setMsg(""), 3000);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : JSON.stringify(e);
      setMsg(`Gagal: ${errMsg}`);
      setMsgOk(false);
      console.error("[Avatar]", e);
    }
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Profil</h1>
        </div>

        {/* Avatar */}
        <div className="mb-6 flex flex-col items-center rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="relative mb-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 overflow-hidden cursor-pointer" onClick={() => fileRef.current?.click()}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">
              <Pencil className="h-3 w-3" />
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAvatar(f); e.target.value = ""; }} />
          </div>

          {/* Name */}
          {editing === "name" ? (
            <div className="flex items-center gap-2">
              <input type="text" value={editVal} onChange={e => setEditVal(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" autoFocus />
              <button onClick={handleSaveName} disabled={loading} className="text-success"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditing(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground">{profile?.fullName || "User"}</p>
              <button onClick={() => { setEditing("name"); setEditVal(profile?.fullName || ""); }} className="text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        {/* Info cards */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            {editingProperty ? (
              <div className="flex-1 space-y-2">
                <select value={editPropertyId} onChange={e => setEditPropertyId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" autoFocus>
                  <option value="">Pilih properti...</option>
                  {allProperties?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.location ? ` — ${p.location}` : ""}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveProperty} disabled={propSaving || !editPropertyId} className="text-success"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingProperty(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Properti</p>
                  <p className="text-sm font-semibold text-foreground">{propertyName || "—"}</p>
                  {propertyLocation && <p className="text-xs text-muted-foreground">{propertyLocation}</p>}
                </div>
                {profile?.role === "super_admin" && (
                  <button onClick={() => { setEditingProperty(true); setEditPropertyId(profile?.propertyId || ""); }} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-semibold text-foreground capitalize">{profile?.role?.replace("_", " ")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Skema Investasi</p>
              <p className="text-sm font-semibold text-foreground">Hybrid</p>
            </div>
          </div>
        </div>

        {/* Edit Email (Super Admin only) */}
        {profile?.role === "super_admin" && (
          <div className="mb-3 space-y-2">
            <button onClick={() => { setEditing(editing === "email" ? null : "email"); setEditVal(""); setMsg(""); }}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm hover:bg-muted/50">
              <span className="text-sm font-medium text-foreground">Ganti Email</span>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
            {editing === "email" && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <input type="email" value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Email baru"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
                <button onClick={handleSaveEmail} disabled={loading}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan Email"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit Password */}
        <div className="mb-6 space-y-2">
          <button onClick={() => { setEditing(editing === "password" ? null : "password"); setEditVal(""); setEditVal2(""); setMsg(""); }}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm hover:bg-muted/50">
            <span className="text-sm font-medium text-foreground">Ganti Password</span>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          {editing === "password" && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <input type="password" value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Password baru (min 8 karakter)"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
              <input type="password" value={editVal2} onChange={e => setEditVal2(e.target.value)} placeholder="Konfirmasi password"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
              <button onClick={handleSavePassword} disabled={loading}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {loading ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        {msg && (
          <p className={`mb-4 text-sm text-center ${msgOk ? "text-success" : "text-destructive"}`}>{msg}</p>
        )}

        {/* Admin Panel (Super Admin only) */}
        {profile?.role === "super_admin" && (
          <Link to="/admin/users"
            className="flex w-full items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left shadow-sm hover:bg-primary/10 transition-colors mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Panel Admin</span>
            </div>
            <span className="text-xs text-muted-foreground">Kelola akun →</span>
          </Link>
        )}

        <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive transition-colors hover:bg-destructive/10">
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Keluar dari Akun</span>
        </button>
      </div>
    </MobileLayout>
  );
}

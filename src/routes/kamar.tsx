import { useState, useEffect } from "react";
import { useRooms, useCreateRoom, useUpdateRoom } from "@/hooks/use-rooms";
import { supabase } from "@/integrations/supabase/client";
import {
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useMarkTenantPaid,
  useTenants,
  useDeleteHistoryTenant,
  useDeleteAllHistory,
} from "@/hooks/use-tenants";
import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/hooks/use-auth";
import { uploadRoomPhoto, getRoomPhotos } from "@/lib/storage";
import {
  BedDouble,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Trash2,
  DoorOpen,
  Pencil,
  DollarSign,
  User,
  LogOut,
} from "lucide-react";

const HARGA_HARIAN = 200000;

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const statusConfig: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  bulanan: {
    label: "Terisi (Bulanan)",
    badge: "bg-success/10 text-success",
    dot: "bg-success",
  },
  harian: {
    label: "Terisi (Harian)",
    badge: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  tersedia: {
    label: "Tersedia",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

interface TenantFormData {
  name: string;
  phone: string;
  leaseStart: string;
  leaseEnd: string;
  idType: string;
  idNumber: string;
}

const emptyForm: TenantFormData = {
  name: "",
  phone: "",
  leaseStart: "",
  leaseEnd: "",
  idType: "KTP",
  idNumber: "",
};

export default function KamarPage() {
  const { data: rooms, isLoading } = useRooms();
  const { data: allTenants } = useTenants();
  const historyTenants = allTenants?.filter(t => t.status === "ended") || [];
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();
  const markPaid = useMarkTenantPaid();
  const deleteHistory = useDeleteHistoryTenant();
  const deleteAllHistory = useDeleteAllHistory();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const { profile } = useAuth();

  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<{ id: string; name: string; phone: string; leaseStart: string; leaseEnd: string } | null>(null);
  const [editingRoom, setEditingRoom] = useState<{ id: string; room_number: number; name: string; type: "bulanan" | "harian"; monthly_price: number | null; daily_price: number | null; notes: string | null } | null>(null);
  const [roomForm, setRoomForm] = useState<{ name: string; room_number: number; type: "bulanan" | "harian"; monthly_price: number; daily_price: number; notes: string; photoFile?: File }>({ name: "", room_number: 0, type: "bulanan", monthly_price: 1500000, daily_price: 200000, notes: "" });
  const [filter, setFilter] = useState("semua");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"rooms" | "history">("rooms");
  const [roomPhotos, setRoomPhotos] = useState<Record<string, { id: string; photo_url: string; caption: string }[]>>({});
  const [photoMenu, setPhotoMenu] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [form, setForm] = useState<TenantFormData>(emptyForm);
  const [formError, setFormError] = useState("");

  const canManage =
    profile &&
    ["super_admin", "manager_only", "investor_manager"].includes(profile.role);

  const terisi =
    rooms?.filter((r) => r.status === "terisi").length || 0;
  const total = rooms?.length || 0;

  // Load first photo per room
  useEffect(() => {
    if (!rooms?.length) return;
    rooms.forEach((room) => {
      if (roomPhotos[room.id] !== undefined) return;
      getRoomPhotos(room.id).then(photos => {
        setRoomPhotos(prev => ({ ...prev, [room.id]: photos }));
      }).catch(() => {});
    });
  }, [rooms?.length]);

  function resetForm() {
    setForm(emptyForm);
    setFormError("");
    setSelectedRoomId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!selectedRoomId) {
      setFormError("Pilih kamar terlebih dahulu");
      return;
    }
    if (form.leaseEnd <= form.leaseStart) {
      setFormError("Tanggal akhir harus setelah tanggal mulai");
      return;
    }

    try {
      await createTenant.mutateAsync({
        room_id: selectedRoomId,
        name: form.name,
        phone: form.phone,
        lease_start: form.leaseStart,
        lease_end: form.leaseEnd,
        id_type: form.idType,
        id_number: form.idNumber,
        status: "active",
        email: "",
      });
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setFormError(`Gagal: ${msg}`);
    }
  }

  async function handleEndLease(tenantId: string, roomId: string) {
    if (!confirm("Yakin ingin mengakhiri sewa?")) return;
    try {
      await deleteTenant.mutateAsync({ id: tenantId, roomId });
    } catch {
      alert("Gagal mengakhiri sewa. Coba lagi.");
    }
  }

  function startEditTenant(tenant: NonNullable<typeof rooms>[number]["tenants"][number]) {
    setEditingTenant({
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone || "",
      leaseStart: tenant.lease_start,
      leaseEnd: tenant.lease_end,
    });
  }

  async function handleSaveTenant() {
    if (!editingTenant) return;
    try {
      await updateTenant.mutateAsync({
        id: editingTenant.id,
        name: editingTenant.name,
        phone: editingTenant.phone,
        lease_start: editingTenant.leaseStart,
        lease_end: editingTenant.leaseEnd,
      } as { id: string; [key: string]: unknown });
      setEditingTenant(null);
      alert("Data penyewa diupdate");
    } catch (e: unknown) {
      alert(`Gagal update tenant: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handleMarkPaid(tenant: NonNullable<typeof rooms>[number]["tenants"][number], room: NonNullable<typeof rooms>[number]) {
    const fullAmount = room.type === "bulanan" ? (room.monthly_price || 1500000) : (room.daily_price || 200000);
    const paidSoFar = tenant.paid_amount || 0;
    const remaining = fullAmount - paidSoFar;
    const category = room.type === "bulanan" ? "monthly_rent" : "daily_rent";
    const label = room.name || `Kamar ${room.room_number}`;

    const msg = paidSoFar > 0
      ? `Sisa pembayaran ${tenant.name}: Rp ${remaining.toLocaleString("id-ID")} (dari Rp ${fullAmount.toLocaleString("id-ID")})`
      : `Jumlah pembayaran untuk ${tenant.name} (Rp):`;
    const defaultVal = paidSoFar > 0 ? remaining : fullAmount;

    const input = prompt(msg, defaultVal.toLocaleString("id-ID"));
    if (!input) return;

    const amount = parseInt(input.replace(/\D/g, "")) || 0;
    if (amount <= 0) { alert("Jumlah tidak valid"); return; }

    const totalPaid = paidSoFar + amount;
    const isPartial = totalPaid < fullAmount;
    if (isPartial && !confirm(`Bayar Rp ${amount.toLocaleString("id-ID")}? Sisa: Rp ${(fullAmount - totalPaid).toLocaleString("id-ID")}`)) return;

    try {
      await markPaid.mutateAsync({
        tenantId: tenant.id,
        roomId: room.id,
        amount: amount,
        category: category as "monthly_rent" | "daily_rent",
        description: `${isPartial ? "Pembayaran sebagian" : category === "monthly_rent" ? "Sewa bulanan" : "Sewa harian"} - ${label} - ${tenant.name}${paidSoFar > 0 ? ` (tahap ke-${Math.ceil(paidSoFar / (fullAmount || 1) * 2)})` : ""}`,
        isPartial,
        paidSoFar,
      });
      alert(isPartial ? `Pembayaran Rp ${amount.toLocaleString("id-ID")} dicatat. Sisa: Rp ${(fullAmount - totalPaid).toLocaleString("id-ID")}` : "Pembayaran lunas tercatat");
    } catch (e: unknown) {
      const msg = typeof e === "object" && e ? JSON.stringify(e, Object.getOwnPropertyNames(e)) : String(e);
      alert(`Gagal: ${msg}`);
    }
  }

  async function handleUploadPhoto(roomId: string, file: File) {
    if (!profile?.id) return;
    setUploadingPhoto(true);
    try {
      await uploadRoomPhoto(roomId, file, "", "interior", profile.id);
      const photos = await getRoomPhotos(roomId);
      setRoomPhotos(prev => ({ ...prev, [roomId]: photos }));
    } catch (e: unknown) {
      alert(`Gagal upload: ${e instanceof Error ? e.message : "error"}`);
    }
    setUploadingPhoto(false);
  }

  async function handleDeleteHistoryTenant(id: string) {
    if (!confirm("Hapus riwayat ini? Transaksi terkait juga akan dihapus.")) return;
    try { await deleteHistory.mutateAsync(id); }
    catch { alert("Gagal hapus riwayat"); }
  }

  async function handleDeleteAllHistory() {
    if (!confirm(`Hapus semua ${historyTenants.length} riwayat? Transaksi terkait juga akan dihapus.`)) return;
    try { await deleteAllHistory.mutateAsync(); }
    catch { alert("Gagal hapus semua"); }
  }

  async function handleAddRoom() {
    if (!roomForm.name.trim()) { alert("Nama kamar harus diisi"); return; }
    const maxNum = rooms?.reduce((max, r) => Math.max(max, r.room_number), 0) || 0;
    const nextNum = maxNum + 1;
    try {
      const result = await createRoom.mutateAsync({
        room_number: nextNum,
        name: roomForm.name.trim(),
        notes: roomForm.notes || undefined,
        type: roomForm.type,
        ...(roomForm.type === "bulanan" ? { monthly_price: roomForm.monthly_price } : { daily_price: roomForm.daily_price }),
      });
      // Upload photo if selected
      if (roomForm.photoFile && result?.id && profile?.id) {
        await uploadRoomPhoto(result.id, roomForm.photoFile, "", "interior", profile.id);
      }
      setShowRoomForm(false);
      setRoomForm({ name: "", room_number: 0, type: "bulanan", monthly_price: 1500000, daily_price: 200000, notes: "", photoFile: undefined });
      if (roomForm.photoFile && result?.id) {
        const photos = await getRoomPhotos(result.id);
        setRoomPhotos(prev => ({ ...prev, [result.id]: photos }));
      }
    } catch (e) { alert(`Gagal: ${e instanceof Error ? e.message : "error"}`); }
  }

  async function handleDeleteRoom(roomId: string, roomNumber: number) {
    if (!confirm(`Hapus Kamar ${roomNumber}?`)) return;
    try {
      // Try RPC function first (bypasses RLS with SECURITY DEFINER)
      const { error: rpcErr } = await supabase.rpc('delete_room_cascade', { room_id: roomId });
      if (rpcErr) {
        console.warn("[DeleteRoom] RPC failed, trying direct delete:", rpcErr);
        // Fallback: manual delete with individual checks
        await supabase.from("tenants").delete().eq("room_id", roomId);
        await supabase.from("room_photos").delete().eq("room_id", roomId);
        const { data: reqs } = await supabase.from("requests").select("id").eq("room_id", roomId);
        if (reqs?.length) {
          await supabase.from("request_photos").delete().in("request_id", reqs.map(r => r.id));
        }
        await supabase.from("requests").delete().eq("room_id", roomId);
        const fallback = await supabase.from("rooms").delete().eq("id", roomId);
        if (fallback.error) throw fallback.error;
      }
      alert(`Kamar ${roomNumber} berhasil dihapus`);
      window.location.reload();
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e ? JSON.stringify(e, Object.getOwnPropertyNames(e)) : String(e);
      alert(`Gagal hapus: ${msg}`);
      console.error("[DeleteRoom]", e);
    }
  }

  function startEditRoom(room: NonNullable<typeof rooms>[number]) {
    setEditingRoom({
      id: room.id,
      room_number: room.room_number,
      name: room.name || "",
      type: room.type,
      monthly_price: room.monthly_price,
      daily_price: room.daily_price,
      notes: room.notes || null,
    });
  }

  async function handleSaveRoom() {
    if (!editingRoom) return;
    try {
      await updateRoom.mutateAsync({
        id: editingRoom.id,
        type: editingRoom.type,
        monthly_price: editingRoom.type === "bulanan" ? editingRoom.monthly_price : null,
        daily_price: editingRoom.type === "harian" ? editingRoom.daily_price : null,
        notes: editingRoom.notes || null,
      });
      setEditingRoom(null);
      alert("Kamar berhasil diupdate");
    } catch (e) {
      alert(`Gagal update kamar: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Status Kamar</h1>
            <p className="text-sm text-muted-foreground">{view === "rooms" ? "Ketersediaan unit saat ini" : "Riwayat penyewa"}</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            <button onClick={() => setView("rooms")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "rooms" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Kamar
            </button>
            <button onClick={() => setView("history")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "history" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Riwayat
            </button>
          </div>
        </div>
          {view === "rooms" && canManage && (
            <div className="flex gap-2">
              {profile?.role === "super_admin" && (
                <button
                  onClick={() => setShowRoomForm(!showRoomForm)}
                  className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary"
                >
                  <DoorOpen className="h-3.5 w-3.5" />
                  {showRoomForm ? "Tutup" : "Kamar"}
                </button>
              )}
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
              >
                {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showForm ? "Tutup" : "Tenant"}
              </button>
            </div>
          )}

        {view === "rooms" && (<>
          <div className="my-4 flex gap-3">
            <div className="flex-1 rounded-2xl bg-success/5 border border-success/10 p-3 text-center cursor-pointer" onClick={() => setFilter("terisi")}>
              <p className="text-2xl font-bold text-success">{terisi}</p>
              <p className="text-[11px] text-muted-foreground">Terisi</p>
            </div>
            <div className="flex-1 rounded-2xl bg-muted border border-border p-3 text-center cursor-pointer" onClick={() => setFilter("tersedia")}>
              <p className="text-2xl font-bold text-muted-foreground">{total - terisi}</p>
              <p className="text-[11px] text-muted-foreground">Tersedia</p>
            </div>
          </div>

        {/* Filter & Search */}
        <div className="mb-4 flex gap-2 items-center">
          <div className="flex gap-1">
            {["semua", "tersedia", "terisi"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {f === "semua" ? "Semua" : f === "tersedia" ? "Kosong" : "Terisi"}
              </button>
            ))}
          </div>
          <input type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kamar..."
            className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
        </div>

        {/* Tenant Form */}
        {showForm && canManage && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Tambah Penyewa Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={selectedRoomId || ""}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                required
              >
                <option value="">Pilih Kamar</option>
                {rooms
                  ?.filter((r) => r.status === "tersedia")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || `Kamar ${r.room_number}`} — {r.type === "bulanan" ? `Rp ${(r.monthly_price || 1500000).toLocaleString("id-ID")}/bln` : `Rp ${(r.daily_price || 200000).toLocaleString("id-ID")}/malam`}
                    </option>
                  ))}
              </select>

              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama penyewa"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                required
              />
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="No. telepon"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Mulai Sewa
                  </label>
                  <input
                    type="date"
                    value={form.leaseStart}
                    onChange={(e) =>
                      setForm({ ...form, leaseStart: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Akhir Sewa
                  </label>
                  <input
                    type="date"
                    value={form.leaseEnd}
                    onChange={(e) =>
                      setForm({ ...form, leaseEnd: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.idType}
                  onChange={(e) => setForm({ ...form, idType: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="KTP">KTP</option>
                  <option value="SIM">SIM</option>
                  <option value="Paspor">Paspor</option>
                </select>
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(e) =>
                    setForm({ ...form, idNumber: e.target.value })
                  }
                  placeholder="No. identitas"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <button
                type="submit"
                disabled={createTenant.isPending}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createTenant.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        )}

        {/* Room Add Form (Super Admin only) */}
        {showRoomForm && profile?.role === "super_admin" && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Tambah Kamar Baru</h3>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Nomor kamar akan dibuat otomatis (unique).</p>
              <input type="text" value={roomForm.name}
                onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                placeholder="Nama kamar (contoh: Melati, Mawar, K1, dll)"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />

              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setRoomForm({ ...roomForm, type: "bulanan", monthly_price: 1500000 })}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold ${roomForm.type === "bulanan" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  Bulanan
                </button>
                <button type="button"
                  onClick={() => setRoomForm({ ...roomForm, type: "harian", daily_price: 200000 })}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold ${roomForm.type === "harian" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  Harian
                </button>
              </div>

              <input type="number" value={roomForm.type === "bulanan" ? roomForm.monthly_price : roomForm.daily_price}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0;
                  setRoomForm(roomForm.type === "bulanan" ? { ...roomForm, monthly_price: val } : { ...roomForm, daily_price: val });
                }}
                placeholder={roomForm.type === "bulanan" ? "Harga bulanan" : "Harga per malam"}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />

              <textarea value={roomForm.notes || ""}
                onChange={e => setRoomForm({ ...roomForm, notes: e.target.value })}
                placeholder="Catatan (opsional)"
                rows={2}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none resize-none" />

              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                <span className="text-lg">📸</span> {roomForm.photoFile ? roomForm.photoFile.name : "Foto kamar (opsional)"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setRoomForm({ ...roomForm, photoFile: file });
                  }} />
                {roomForm.photoFile && (
                  <button type="button" onClick={() => setRoomForm({ ...roomForm, photoFile: undefined })} className="text-xs text-destructive">✕</button>
                )}
              </label>

              <button onClick={handleAddRoom} disabled={createRoom.isPending}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {createRoom.isPending ? "Menambah..." : "Tambah Kamar"}
              </button>
            </div>
          </div>
        )}

        {/* Room List */}
        <div className="space-y-3 max-h-[calc(100dvh-320px)] overflow-y-auto pr-1">
          {rooms
            ?.filter(r => {
              if (filter === "tersedia") return r.status === "tersedia";
              if (filter === "terisi") return r.status === "terisi";
              return true;
            })
            .filter(r => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (r.name || `Kamar ${r.room_number}`).toLowerCase().includes(q)
                || String(r.room_number).includes(q);
            })
            .map((room) => {
            const cfg =
              room.status === "terisi"
                ? statusConfig[room.type]
                : statusConfig["tersedia"];
            const isHarian = room.type === "harian" && room.status === "terisi";
            const isExpanded = expandedRoom === room.roomNumber;
            const tenant = room.tenants?.filter((t: { status: string }) => t.status === "active")?.[0];

            return (
              <div
                key={room.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div
                  className={`flex items-center gap-3 p-4 ${
                    isHarian ? "cursor-pointer" : ""
                  }`}
                  onClick={() =>
                    isHarian &&
                    setExpandedRoom(isExpanded ? null : room.roomNumber)
                  }
                >
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 overflow-hidden rounded-xl bg-primary/5 cursor-pointer"
                      onClick={() => setPhotoMenu(photoMenu === room.id ? null : room.id)}>
                      {roomPhotos[room.id]?.[0] ? (
                        <img src={roomPhotos[room.id][0].photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BedDouble className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    {/* Photo menu dropdown */}
                    {photoMenu === room.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setPhotoMenu(null)} />
                        <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-xl border border-border bg-white shadow-lg overflow-hidden">
                          {roomPhotos[room.id]?.[0] && (
                            <button onClick={() => { setViewerUrl(roomPhotos[room.id][0].photo_url); setPhotoMenu(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                              👁️ Lihat Gambar
                            </button>
                          )}
                          {canManage && (
                            <label className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer">
                              📸 {uploadingPhoto ? "Mengupload..." : "Upload Foto"}
                              <input type="file" accept="image/*" className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) { await handleUploadPhoto(room.id, file); setPhotoMenu(null); e.target.value = ""; }
                                }} />
                            </label>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                    <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {room.name || `Kamar ${room.room_number}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {room.name ? `Unit #${room.room_number}` : `Unit lantai ${Math.ceil(room.room_number / 2)}`}
                    </p>
                    {room.creator && (
                      <p className="text-[10px] text-muted-foreground/60 mt-px">
                        Dibuat oleh: {room.creator.full_name}
                      </p>
                    )}
                    {tenant && (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-[12px] font-medium text-foreground">{tenant.name}</p>
                        <p className="text-[10px] text-muted-foreground">{tenant.lease_start} — {tenant.lease_end}</p>
                        {tenant.phone && <p className="text-[10px] text-muted-foreground">📞 {tenant.phone}</p>}
                        {tenant.id_number && <p className="text-[10px] text-muted-foreground">{tenant.id_type || "ID"}: {tenant.id_number}</p>}
                      </div>
                    )}
                    {!room.creator && !tenant && (<div />)}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${cfg.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  {tenant && tenant.payment_status === "unpaid" && (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-semibold text-destructive whitespace-nowrap">
                      Belum Dibayar
                    </span>
                  )}
                  {tenant && tenant.payment_status === "paid" && (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success whitespace-nowrap">
                      Lunas
                    </span>
                  )}
                  {tenant && tenant.payment_status === "partial" && (() => {
                    const total = room.type === "bulanan" ? (room.monthly_price || 1500000) : (room.daily_price || 200000);
                    const paid = tenant.paid_amount || 0;
                    const sisa = total - paid;
                    return (
                      <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-1 text-[10px] font-semibold text-warning whitespace-nowrap">
                        Sisa: Rp {sisa.toLocaleString("id-ID")}
                      </span>
                    );
                  })()}
                  {isHarian &&
                    (isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ))}
                </div>

                {/* Informasi Kamar */}
                {(room.notes || room.type || room.monthly_price || room.daily_price) && (
                  <div className="border-t border-border px-4 py-3 space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Informasi Kamar</p>
                    <p className="text-[11px] text-foreground">
                      {room.type === "bulanan" ? `Bulanan · Rp ${(room.monthly_price || 1500000).toLocaleString("id-ID")}/bln` : `Harian · Rp ${(room.daily_price || 200000).toLocaleString("id-ID")}/malam`}
                    </p>
                    {room.notes && <p className="text-[11px] text-muted-foreground italic">{room.notes}</p>}
                  </div>
                )}

                {/* Room actions — for empty rooms only */}
                {profile?.role === "super_admin" && room.status !== "terisi" && (
                  <div className="border-t border-border px-4 py-2 flex items-center gap-4 justify-end">
                    <button onClick={() => startEditRoom(room)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit kamar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id, room.room_number)} className="text-muted-foreground hover:text-destructive transition-colors" title="Hapus kamar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Tenant actions — only for occupied rooms */}
                {room.status === "terisi" && tenant && canManage && (
                  <div className="border-t border-border px-4 py-2 flex items-center gap-4 justify-end">
                    {tenant.payment_status === "unpaid" && (
                      <button onClick={() => handleMarkPaid(tenant, room)}
                        className="text-success hover:text-success/80 transition-colors" title="Catat pembayaran">
                        <DollarSign className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {tenant.payment_status === "partial" && (
                      <button onClick={() => handleMarkPaid(tenant, room)}
                        className="text-warning hover:text-warning/80 transition-colors" title="Lanjutkan pembayaran">
                        <DollarSign className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => startEditTenant(tenant)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit penyewa">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleEndLease(tenant.id, room.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Akhiri sewa">
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Edit room form */}
                {editingRoom?.id === room.id && profile?.role === "super_admin" && (() => {
                  const er = editingRoom!;
                  return (
                  <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => setEditingRoom({ ...er, type: "bulanan" })}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${er.type === "bulanan" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                        Bulanan
                      </button>
                      <button type="button"
                        onClick={() => setEditingRoom({ ...er, type: "harian" })}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${er.type === "harian" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                        Harian
                      </button>
                    </div>
                    <input type="number"
                      value={er.type === "bulanan" ? er.monthly_price || "" : er.daily_price || ""}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        setEditingRoom({ ...er, ...(er.type === "bulanan" ? { monthly_price: v } : { daily_price: v }) });
                      }}
                      className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground" />
                    <textarea value={er.notes || ""}
                      onChange={e => setEditingRoom({ ...er, notes: e.target.value })}
                      placeholder="Catatan"
                      rows={2}
                      className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground resize-none" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveRoom} className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-white">Simpan</button>
                      <button onClick={() => setEditingRoom(null)} className="flex-1 rounded-lg bg-muted py-1.5 text-xs font-semibold text-muted-foreground">Batal</button>
                    </div>
                  </div>
                  );
                })()}

                {/* Daily rent detail */}
                {isHarian && isExpanded && (
                  <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-muted-foreground">Harga per malam</span>
                      <span className="font-medium text-foreground">
                        {formatRupiah(HARGA_HARIAN)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-foreground">
                        Terisi
                      </span>
                    </div>
                  </div>
                )}

                {/* Edit tenant form */}
                {editingTenant && editingTenant.id === tenant?.id && (() => {
                  const et = editingTenant!;
                  return (
                  <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
                    <input type="text" value={et.name}
                      onChange={e => setEditingTenant({ ...et, name: e.target.value })}
                      placeholder="Nama penyewa"
                      className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground" />
                    <input type="text" value={et.phone}
                      onChange={e => setEditingTenant({ ...et, phone: e.target.value })}
                      placeholder="No telepon"
                      className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={et.leaseStart}
                        onChange={e => setEditingTenant({ ...et, leaseStart: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground" />
                      <input type="date" value={et.leaseEnd}
                        onChange={e => setEditingTenant({ ...et, leaseEnd: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveTenant} className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-white">Simpan Tenant</button>
                      <button onClick={() => setEditingTenant(null)} className="flex-1 rounded-lg bg-muted py-1.5 text-xs font-semibold text-muted-foreground">Batal</button>
                    </div>
                  </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </>
      )}

      {/* History view */}
      {view === "history" && (
        <div className="pb-6">
          {historyTenants.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Belum ada riwayat penyewa</p>
          ) : (
            <div className="space-y-3 max-h-[calc(100dvh-320px)] overflow-y-auto pr-1">
              <div className="flex justify-end">
                {canManage && (
                  <button onClick={handleDeleteAllHistory} className="text-xs text-destructive hover:text-destructive/80">Hapus Semua</button>
                )}
              </div>
              {historyTenants.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card px-3.5 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {canManage && (
                            <button onClick={() => handleDeleteHistoryTenant(t.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Hapus">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">Selesai</span>
                        </div>
                      </div>
                      {t.rooms && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.rooms.name || `Kamar ${t.rooms.room_number}`}
                          <span className="ml-1.5 text-[10px] text-muted-foreground/60">({t.rooms.type})</span>
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span>{t.lease_start} — {t.lease_end}</span>
                        {t.phone && <span>📞 {t.phone}</span>}
                        {t.id_number && <span>{t.id_type || "ID"}: {t.id_number}</span>}
                        {t.paid_amount ? (
                          <span className="text-success">Lunas Rp {t.paid_amount.toLocaleString("id-ID")}</span>
                        ) : (
                          <span className="text-destructive">Belum dibayar</span>
                        )}
                        {t.ended_at && <span className="text-muted-foreground/60">Selesai: {t.ended_at}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Photo viewer modal */}
      {viewerUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setViewerUrl(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewerUrl(null)} className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300">Tutup ✕</button>
            <img src={viewerUrl} alt="Foto kamar" className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

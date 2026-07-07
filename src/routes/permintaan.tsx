import { useState, useRef } from "react";
import {
  useRequests,
  useCreateRequest,
  useUpdateRequestStatus,
  useDeleteRequest,
  useDeleteAllRequests,
} from "@/hooks/use-requests";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import {
  Wrench,
  Package,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; cls: string }
> = {
  menunggu: { label: "Menunggu Persetujuan", cls: "bg-muted text-muted-foreground" },
  diizinkan: { label: "Diizinkan", cls: "bg-primary/10 text-primary" },
  ditolak: { label: "Ditolak", cls: "bg-destructive/10 text-destructive" },
  proses: { label: "Sedang Diproses", cls: "bg-warning/10 text-warning" },
  selesai: { label: "Selesai", cls: "bg-success/10 text-success" },
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  maintenance: Wrench,
  inventory: Package,
};

export default function PermintaanPage() {
  const { data: requests, isLoading, refetch } = useRequests();
  const createRequest = useCreateRequest();
  const updateStatus = useUpdateRequestStatus();
  const deleteRequest = useDeleteRequest();
  const deleteAllRequests = useDeleteAllRequests();
  const { profile } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "maintenance",
    title: "",
    estimated_cost: 0,
    notes: "",
    room_id: "",
  });
  const [formError, setFormError] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const canManage =
    profile &&
    ["super_admin", "manager_only", "investor_manager"].includes(profile.role);
  const canApprove =
    profile &&
    ["super_admin", "investor_only", "investor_manager"].includes(profile.role);

  function resetForm() {
    setForm({ type: "maintenance", title: "", estimated_cost: 0, notes: "", room_id: "" });
    setFormError("");
    setShowForm(false);
    setPhotoFiles([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.title) {
      setFormError("Judul harus diisi");
      return;
    }
    if (form.type === "maintenance" && form.estimated_cost <= 0) {
      setFormError("Estimasi biaya harus diisi untuk maintenance");
      return;
    }

    try {
      const result = await createRequest.mutateAsync({
        type: form.type,
        title: form.title,
        estimated_cost: form.estimated_cost || null,
        notes: form.notes || null,
        room_id: form.room_id || null,
      });

      // Upload photos
      if (photoFiles.length > 0 && result?.id && profile?.id) {
        setUploading(true);
        for (const file of photoFiles) {
          const ext = file.name.split(".").pop();
          const path = `requests/${result.id}/${Date.now()}.${ext}`;
          await supabase.storage.from("room-photos").upload(path, file);
          const { data: urlData } = supabase.storage.from("room-photos").getPublicUrl(path);
          await supabase.from("request_photos").insert({
            request_id: result.id,
            photo_url: urlData.publicUrl,
            photo_type: "evidence",
            uploaded_by: profile.id,
          });
        }
      }

      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setFormError(`Gagal: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await updateStatus.mutateAsync({ id, status: "diizinkan", approvedBy: profile?.id });
    } catch {
      alert("Gagal approve request");
    }
  }

  async function handleReject(id: string) {
    try {
      await updateStatus.mutateAsync({ id, status: "ditolak", approvedBy: profile?.id });
    } catch {
      alert("Gagal reject request");
    }
  }

  async function handleProses(id: string) {
    try {
      await updateStatus.mutateAsync({ id, status: "proses" });
    } catch {
      alert("Gagal update status");
    }
  }

  async function handleSelesai(id: string) {
    try {
      await updateStatus.mutateAsync({ id, status: "selesai" });
    } catch {
      alert("Gagal update status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus permintaan ini?")) return;
    try { await deleteRequest.mutateAsync(id); }
    catch { alert("Gagal hapus"); }
  }

  async function handleDeleteAll() {
    if (!confirm(`Hapus semua ${requests?.length || 0} permintaan?`)) return;
    try { await deleteAllRequests.mutateAsync(); }
    catch { alert("Gagal hapus semua"); }
  }

  async function handleUpload(requestId: string, file: File, type: string) {
    if (!profile?.id) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `requests/${requestId}/${type}_${Date.now()}.${ext}`;
      await supabase.storage.from("room-photos").upload(path, file);
      const { data: urlData } = supabase.storage.from("room-photos").getPublicUrl(path);
      await supabase.from("request_photos").insert({
        request_id: requestId,
        photo_url: urlData.publicUrl,
        photo_type: type,
        uploaded_by: profile.id,
      });
      // Refetch requests to show new photo
      await refetch();
    } catch (e) { alert(`Gagal upload: ${e instanceof Error ? e.message : "error"}`); }
  }

  const filteredRequests = requests?.filter((r) => {
    const showForManager =
      canManage || r.status === "menunggu" || r.status === "diizinkan";
    const showForInvestor =
      canApprove || r.status !== "ditolak";
    if (canManage && canApprove) return true;
    if (canManage) return showForManager;
    if (canApprove) return showForInvestor;
    return true;
  });

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Permintaan Operasional</h1>
            <p className="text-sm text-muted-foreground">Pemeliharaan dan kebutuhan unit</p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {requests && requests.length > 0 && (
                <button onClick={handleDeleteAll} className="flex items-center justify-center rounded-xl border border-destructive/30 bg-white px-3 py-2 text-destructive hover:bg-destructive/5 transition-colors" title="Hapus semua">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
              >
                {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showForm ? "Tutup" : "Buat"}
              </button>
            </div>
          )}
        </div>

        {/* Create Form */}
        {showForm && canManage && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Permintaan Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "maintenance" })}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                    form.type === "maintenance"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Wrench className="mx-auto mb-1 h-4 w-4" />
                  Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "inventory" })}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                    form.type === "inventory"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Package className="mx-auto mb-1 h-4 w-4" />
                  Inventory
                </button>
              </div>

              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul permintaan"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                required
              />

              {form.type === "maintenance" && (
                <input
                  type="number"
                  value={form.estimated_cost || ""}
                  onChange={(e) =>
                    setForm({ ...form, estimated_cost: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Estimasi biaya (Rp)"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              )}

              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan (opsional)"
                rows={2}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none resize-none"
              />

              {/* Photo upload */}
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                📸 {photoFiles.length > 0 ? `${photoFiles.length} foto dipilih` : "Tambah foto (opsional)"}
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setPhotoFiles(prev => [...prev, ...files].slice(0, 5));
                    e.target.value = "";
                  }} />
              </label>
              {photoFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photoFiles.map((f, i) => (
                    <div key={i} className="relative">
                      <span className="text-[10px] text-muted-foreground">{f.name.slice(0, 15)}...</span>
                      <button type="button" onClick={() => setPhotoFiles(prev => prev.filter((_, j) => j !== i))}
                        className="ml-1 text-destructive text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <button
                type="submit"
                disabled={createRequest.isPending || uploading}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? "Mengupload..." : createRequest.isPending ? "Menyimpan..." : "Kirim Permintaan"}
              </button>
            </form>
          </div>
        )}

        {/* Request List */}
        <div className="space-y-3 max-h-[calc(100dvh-320px)] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
            </div>
          ) : filteredRequests?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Belum ada permintaan
            </p>
          ) : (
            filteredRequests?.map((req) => {
              const cfg = statusConfig[req.status];
              const IconComp =
                typeIcons[req.type] || (req.type === "maintenance" ? Wrench : Package);

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
                      <IconComp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {req.title}
                      </p>
                      {req.rooms && (
                        <p className="text-[11px] text-muted-foreground">
                          Kamar {req.rooms.room_number}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {req.estimated_cost && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Est. biaya: Rp{" "}
                          {req.estimated_cost.toLocaleString("id-ID")}
                        </p>
                      )}
                      {req.creator && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Oleh: {req.creator.full_name}
                        </p>
                      )}
                      {req.approver && (
                        <p className="text-[10px] text-muted-foreground">
                          Disetujui: {req.approver.full_name}
                        </p>
                      )}
                      {req.request_photos?.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 items-start">
                          {req.request_photos.map((photo: { id: string; photo_url: string }) => (
                            <img key={photo.id} src={photo.photo_url} alt=""
                              className="h-14 w-20 shrink-0 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setViewerUrl(photo.photo_url)} />
                          ))}
                          {canManage && req.status !== "ditolak" && (
                            <>
                              <button type="button" onClick={() => fileInputRefs.current[req.id]?.click()}
                                className="inline-flex items-center justify-center w-14 h-14 shrink-0 border-2 border-dashed border-muted-foreground/40 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors" title="Tambah foto">
                                <Plus className="h-5 w-5 text-muted-foreground" />
                              </button>
                              <input type="file" accept="image/*" className="hidden" ref={el => fileInputRefs.current[req.id] = el}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) { await handleUpload(req.id, file, "evidence"); e.target.value = ""; }
                                }} />
                            </>
                          )}
                        </div>
                      )}
                      {(!req.request_photos?.length && canManage && req.status !== "ditolak") && (
                        <>
                          <button type="button" onClick={() => fileInputRefs.current[`add-${req.id}`]?.click()}
                            className="inline-flex items-center justify-center w-14 h-14 border-2 border-dashed border-muted-foreground/40 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors mt-2" title="Tambah foto">
                            <Plus className="h-5 w-5 text-muted-foreground" />
                          </button>
                          <input type="file" accept="image/*" className="hidden" ref={el => fileInputRefs.current[`add-${req.id}`] = el}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) { await handleUpload(req.id, file, "evidence"); e.target.value = ""; }
                            }} />
                        </>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${cfg.cls}`}
                    >
                      {cfg.label}
                    </span>
                    {canManage && (
                      <button onClick={() => handleDelete(req.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2" title="Hapus">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Approve/Reject (Investor) */}
                  {req.status === "menunggu" && canApprove && (
                    <div className="mt-3 flex gap-2 border-t border-border pt-3">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Izinkan
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive/10 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20"
                      >
                        <X className="h-3.5 w-3.5" />
                        Tolak
                      </button>
                    </div>
                  )}

                  {/* Proses/Selesai (Manager) */}
                  {req.status === "diizinkan" && canManage && (
                    <div className="mt-3 border-t border-border pt-3">
                      <button
                        onClick={() => handleProses(req.id)}
                        className="w-full rounded-xl bg-warning/10 py-2.5 text-xs font-semibold text-warning hover:bg-warning/20"
                      >
                        Mulai Proses
                      </button>
                    </div>
                  )}

                  {req.status === "proses" && canManage && (
                    <div className="mt-3 border-t border-border pt-3">
                      <button
                        onClick={() => handleSelesai(req.id)}
                        className="w-full rounded-xl bg-success/10 py-2.5 text-xs font-semibold text-success hover:bg-success/20"
                      >
                        Tandai Selesai
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Photo viewer modal */}
      {viewerUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setViewerUrl(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewerUrl(null)} className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300">Tutup ✕</button>
            <img src={viewerUrl} alt="Foto" className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

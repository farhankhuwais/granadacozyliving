import { useState } from "react";
import { useRooms } from "@/hooks/use-rooms";
import {
  useCreateTenant,
  useDeleteTenant,
} from "@/hooks/use-tenants";
import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/hooks/use-auth";
import {
  BedDouble,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Trash2,
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
  const createTenant = useCreateTenant();
  const deleteTenant = useDeleteTenant();
  const { profile } = useAuth();

  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [form, setForm] = useState<TenantFormData>(emptyForm);
  const [formError, setFormError] = useState("");

  const canManage =
    profile &&
    ["super_admin", "manager_only", "investor_manager"].includes(profile.role);

  const terisi =
    rooms?.filter((r) => r.status === "terisi").length || 0;
  const total = rooms?.length || 0;

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
        ...form,
        status: "active",
        email: "",
      });
      resetForm();
    } catch {
      setFormError("Gagal menyimpan data penyewa");
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
            <p className="text-sm text-muted-foreground">Ketersediaan unit saat ini</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
            >
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? "Tutup" : "Tambah"}
            </button>
          )}
        </div>

        <div className="my-4 flex gap-3">
          <div className="flex-1 rounded-2xl bg-success/5 border border-success/10 p-3 text-center">
            <p className="text-2xl font-bold text-success">{terisi}</p>
            <p className="text-[11px] text-muted-foreground">Terisi</p>
          </div>
          <div className="flex-1 rounded-2xl bg-muted border border-border p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">
              {total - terisi}
            </p>
            <p className="text-[11px] text-muted-foreground">Tersedia</p>
          </div>
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
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-600 focus:outline-none"
                required
              >
                <option value="">Pilih Kamar</option>
                {rooms
                  ?.filter((r) => r.status === "tersedia")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Kamar {r.room_number} ({r.type})
                    </option>
                  ))}
              </select>

              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama penyewa"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                required
              />
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="No. telepon"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
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
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-600 focus:outline-none"
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
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.idType}
                  onChange={(e) => setForm({ ...form, idType: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-600 focus:outline-none"
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
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}

              <button
                type="submit"
                disabled={createTenant.isPending}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createTenant.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        )}

        {/* Room List */}
        <div className="space-y-3">
          {rooms?.map((room) => {
            const cfg =
              room.status === "terisi"
                ? statusConfig[room.type]
                : statusConfig["tersedia"];
            const isHarian = room.type === "harian" && room.status === "terisi";
            const isExpanded = expandedRoom === room.roomNumber;
            const tenant = room.tenants?.[0];

            return (
              <div
                key={room.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div
                  className={`flex items-center gap-4 p-4 ${
                    isHarian ? "cursor-pointer" : ""
                  }`}
                  onClick={() =>
                    isHarian &&
                    setExpandedRoom(isExpanded ? null : room.roomNumber)
                  }
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5">
                    <BedDouble className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Kamar {room.room_number}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Unit lantai {Math.ceil(room.room_number / 2)}
                      {tenant && ` - ${tenant.name}`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${cfg.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  {isHarian &&
                    (isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ))}
                </div>

                {/* Tenant actions */}
                {room.status === "terisi" && tenant && canManage && (
                  <div className="border-t border-border px-4 py-2 flex justify-end">
                    <button
                      onClick={() => handleEndLease(tenant.id, room.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      Akhiri Sewa
                    </button>
                  </div>
                )}

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
              </div>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}

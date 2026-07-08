import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit-log";
import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const actionLabels: Record<string, string> = {
  tambah_kamar: "Tambah Kamar",
  hapus_kamar: "Hapus Kamar",
  bayar_lunas: "Pembayaran Lunas",
  bayar_sebagian: "Pembayaran Sebagian",
  buat_permintaan: "Buat Permintaan",
  approve_permintaan: "Approve Permintaan",
  tolak_permintaan: "Tolak Permintaan",
  proses_permintaan: "Proses Permintaan",
  selesai_permintaan: "Selesai Permintaan",
  hapus_permintaan: "Hapus Permintaan",
  buat_transaksi: "Buat Transaksi",
};

const actionIcons: Record<string, string> = {
  tambah_kamar: "🏠",
  hapus_kamar: "🗑️",
  bayar_lunas: "💰",
  bayar_sebagian: "💳",
  buat_permintaan: "📋",
  approve_permintaan: "✅",
  tolak_permintaan: "❌",
  proses_permintaan: "🔧",
  selesai_permintaan: "✅",
  hapus_permintaan: "🗑️",
  buat_transaksi: "💸",
};

function groupByDate(logs: any[]) {
  const groups: Record<string, any[]> = {};
  for (const log of logs) {
    const date = new Date(log.created_at).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
  }
  return groups;
}

export default function RiwayatPage() {
  const { profile } = useAuth();
  const { data: logs, isLoading } = useAuditLogs();
  const [clearing, setClearing] = useState(false);

  if (!profile || profile.role !== "super_admin") return <Navigate to="/" replace />;

  async function handleClear() {
    if (!confirm("Hapus semua riwayat aktivitas?")) return;
    setClearing(true);
    await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setClearing(false);
    window.location.reload();
  }

  const grouped = logs ? groupByDate(logs) : {};

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profil" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Riwayat Aktivitas</h1>
              <p className="text-sm text-muted-foreground">
                {logs?.length || 0} catatan
              </p>
            </div>
          </div>
          {logs && logs.length > 0 && (
            <button onClick={handleClear} disabled={clearing}
              className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-white px-3 py-2 text-xs text-destructive hover:bg-destructive/5" title="Hapus semua riwayat">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Clock className="mb-2 h-8 w-8" />
            <p className="text-sm">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[calc(100dvh-240px)] overflow-y-auto pr-1">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{date}</p>
                <div className="space-y-2">
                  {items.map((log: any) => (
                    <div key={log.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                      <span className="mt-0.5 text-base">{actionIcons[log.action] || "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {actionLabels[log.action] || log.action}
                        </p>
                        {log.target_label && (
                          <p className="text-xs text-muted-foreground">{log.target_label}</p>
                        )}
                        {log.details && (
                          <p className="text-[11px] text-muted-foreground/60">{log.details}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/40">{log.user_email}</span>
                          <span className="text-[10px] text-muted-foreground/40">
                            {new Date(log.created_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

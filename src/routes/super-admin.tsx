import { useDashboard } from "@/hooks/use-dashboard";
import MobileLayout from "@/components/MobileLayout";
import { Link } from "react-router-dom";
import {
  TrendingUp, Activity, BedDouble, CreditCard,
  Users, Package, ChevronRight, ClipboardList, Plus
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-gold/10 border border-gold/20" : "bg-card border border-border"} shadow-sm`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tracking-tight ${highlight ? "text-gold" : "text-foreground"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const { data: stats, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!stats) return null;

  const pieData = [
    { name: "Sewa Bulanan", value: stats.monthlyRent, color: "oklch(0.55 0.06 140)" },
    { name: "Sewa Harian", value: stats.dailyRent, color: "oklch(0.65 0.12 60)" },
  ];

  const quickStats = [
    { label: "Kamar Terisi", value: `${stats.occupiedRooms}/${stats.totalRooms}`, icon: BedDouble, color: "text-success" },
    { label: "Permintaan Aktif", value: String(stats.activeRequestCount), icon: ClipboardList, color: "text-primary" },
    { label: "Okupansi", value: `${stats.occupancyRate}%`, icon: Activity, color: "text-gold" },
  ];

  const actions = [
    { icon: Users, title: "Kelola Kamar & Tenant", desc: "Atur kamar, tambah/hapus penyewa", color: "bg-primary/10 text-primary", link: "/kamar" },
    { icon: Package, title: "Kelola Permintaan", desc: "Buat/approve permintaan maintenance", color: "bg-gold/10 text-gold", link: "/permintaan" },
    { icon: CreditCard, title: "Keuangan", desc: "Input transaksi & lihat laporan", color: "bg-success/10 text-success", link: "/keuangan" },
  ];

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Dashboard Super Admin</h1>
          <p className="text-sm text-muted-foreground">Cozy Living by Granada — Kendali penuh</p>
        </div>

        {/* Investor section */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">Tingkat Okupansi</p>
            <p className="text-2xl font-bold text-primary">{stats.occupancyRate}%</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <TrendingUp className="h-3 w-3" />
            {stats.occupiedRooms}/{stats.totalRooms}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <StatCard label="Pendapatan" value={formatRupiah(stats.totalIncome)}
            sub={`Bulanan ${formatRupiah(stats.monthlyRent)} + Harian ${formatRupiah(stats.dailyRent)}`} />
          <StatCard label="Biaya" value={formatRupiah(stats.totalExpense)}
            sub={`IPL ${formatRupiah(stats.ipl)} + Mgmt ${formatRupiah(stats.managementFee)}`} />
        </div>
        <div className="mb-6">
          <StatCard label="Hasil Bersih" value={formatRupiah(stats.netProfit)} highlight />
        </div>

        {stats.totalIncome > 0 && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Kontribusi Pendapatan</h2>
              <span className="text-[11px] text-muted-foreground">Bulan ini</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupiah(Number(value))}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e5", fontSize: "12px", background: "#fff", color: "#1a1a1a" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manager section */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Aksi Cepat</h2>
          <div className="space-y-3">
            {actions.map((action, i) => (
              <Link key={i} to={action.link}
                className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 text-left">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{action.title}</p>
                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {quickStats.map((stat, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
              <stat.icon className={`mx-auto mb-1 h-5 w-5 ${stat.color}`} />
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/kamar"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary p-4 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Kelola Kamar
          </Link>
          <Link to="/permintaan"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gold p-4 text-sm font-semibold text-white">
            <ClipboardList className="h-4 w-4" /> Permintaan
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}

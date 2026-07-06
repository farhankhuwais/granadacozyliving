import { useDashboard } from "@/hooks/use-dashboard";
import MobileLayout from "@/components/MobileLayout";
import {
  Users,
  Package,
  Wrench,
  BedDouble,
  ClipboardList,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function PengelolaPage() {
  const { data: stats, isLoading } = useDashboard();

  const quickStats = [
    {
      label: "Kamar Terisi",
      value: isLoading ? "-" : `${stats?.occupiedRooms || 0}/${stats?.totalRooms || 0}`,
      icon: BedDouble,
      color: "text-success",
    },
    {
      label: "Permintaan Aktif",
      value: isLoading ? "-" : String(stats?.activeRequestCount || 0),
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      label: "Okupansi",
      value: isLoading ? "-" : `${stats?.occupancyRate || 0}%`,
      icon: Activity,
      color: "text-gold",
    },
  ];

  const actions = [
    {
      icon: Users,
      title: "Update Data Penyewa",
      description: "Perbarui informasi penyewa kamar",
      color: "bg-primary/10 text-primary",
      link: "/kamar",
    },
    {
      icon: Package,
      title: "Request Inventory",
      description: "Ajukan kebutuhan inventaris unit",
      color: "bg-gold/10 text-gold",
      link: "/permintaan",
    },
    {
      icon: Wrench,
      title: "Update Operasional",
      description: "Laporkan perbaikan & pemeliharaan",
      color: "bg-success/10 text-success",
      link: "/permintaan",
    },
  ];

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Dashboard Pengelola</h1>
          <p className="text-sm text-muted-foreground">Cozy Living by Granada</p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {quickStats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm"
            >
              <stat.icon className={`mx-auto mb-1 h-5 w-5 ${stat.color}`} />
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Aksi Cepat</h2>
          <div className="space-y-3">
            {actions.map((action, i) => (
              <Link
                key={i}
                to={action.link}
                className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 text-left"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.color}`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <Link
          to="/permintaan"
          className="flex w-full items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <span className="text-sm font-semibold">Lihat Permintaan Operasional</span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </MobileLayout>
  );
}

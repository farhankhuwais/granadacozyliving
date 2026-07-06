import { useAuth } from "@/hooks/use-auth";
import MobileLayout from "@/components/MobileLayout";
import { User, Building2, BedDouble, TrendingUp, LogOut } from "lucide-react";

export default function ProfilPage() {
  const { profile, signOut } = useAuth();

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Profil Investor</h1>
        </div>

        <div className="mb-6 flex flex-col items-center rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">
            {profile?.fullName || "User"}
          </p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Properti</p>
              <p className="text-sm font-semibold text-foreground">
                Cozy Living by Granada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-semibold text-foreground capitalize">
                {profile?.role?.replace("_", " ")}
              </p>
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

        <div className="mb-6 rounded-2xl bg-primary/5 border border-primary/10 p-4">
          <p className="text-sm leading-relaxed text-foreground">
            Investasi Anda saat ini berjalan dengan tingkat okupansi stabil dan performa optimal.
          </p>
        </div>

        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Keluar dari Akun</span>
        </button>
      </div>
    </MobileLayout>
  );
}

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  Wallet,
  ClipboardList,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["super_admin", "investor_only", "manager_only", "investor_manager"] },
  { path: "/kamar", icon: BedDouble, label: "Kamar", roles: ["super_admin", "investor_only", "manager_only", "investor_manager"] },
  { path: "/keuangan", icon: Wallet, label: "Keuangan", roles: ["super_admin", "investor_only", "investor_manager"] },
  { path: "/permintaan", icon: ClipboardList, label: "Permintaan", roles: ["super_admin", "manager_only", "investor_manager"] },
  { path: "/profil", icon: User, label: "Profil", roles: ["super_admin", "investor_only", "manager_only", "investor_manager"] },
  { path: "/admin/users", icon: Shield, label: "Admin", roles: ["super_admin"] },
];

export default function BottomNav() {
  const location = useLocation();
  const { profile } = useAuth();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems
          .filter((item) => profile && item.roles.includes(profile.role))
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                currentPath === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
      </div>
    </nav>
  );
}

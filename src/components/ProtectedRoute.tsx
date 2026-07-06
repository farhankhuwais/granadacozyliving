import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

type UserRole = "super_admin" | "investor_only" | "manager_only" | "investor_manager";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
      </div>
    );
  }

  if (!session) {
    navigate("/", { replace: true });
    return null;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-black px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-red-900/20">
            <span className="text-xl text-red-400">!</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-muted-foreground">Anda tidak memiliki izin.</p>
          <a href="/" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Kembali</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

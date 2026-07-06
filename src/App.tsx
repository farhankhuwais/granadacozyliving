import { useAuth } from "@/hooks/use-auth";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/routes/login";
import ResetPasswordPage from "@/routes/reset-password";
import SignupPage from "@/routes/signup";
import InvestorDashboardPage from "@/routes/index";
import PengelolaPage from "@/routes/pengelola";
import KamarPage from "@/routes/kamar";
import KeuanganPage from "@/routes/keuangan";
import PermintaanPage from "@/routes/permintaan";
import ProfilPage from "@/routes/profil";
import { AppWithRouter } from "@/components/MobileLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
        <p className="text-sm text-gray-400">Memuat...</p>
      </div>
    </div>
  );
}

function DashboardRouter() {
  const { profile } = useAuth();
  if (!profile) return null;

  const isInvestor = ["super_admin", "investor_only", "investor_manager"].includes(
    profile.role
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          isInvestor ? <InvestorDashboardPage /> : <PengelolaPage />
        }
      />
      <Route
        path="/kamar"
        element={
          <ProtectedRoute>
            <KamarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/keuangan"
        element={
          <ProtectedRoute roles={["super_admin", "investor_only", "investor_manager"]}>
            <KeuanganPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/permintaan"
        element={
          <ProtectedRoute roles={["super_admin", "manager_only", "investor_manager"]}>
            <PermintaanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengelola"
        element={
          <ProtectedRoute roles={["super_admin", "manager_only", "investor_manager"]}>
            <PengelolaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <ProtectedRoute>
            <ProfilPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["super_admin"]}>
            <SignupPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { loading, session } = useAuth();
  const path = window.location.pathname;

  if (path.startsWith("/reset-password")) {
    return <ResetPasswordPage />;
  }

  if (loading) return <LoadingScreen />;
  if (!session) return <LoginPage />;

  return <DashboardRouter />;
}

export default function App() {
  return (
    <AppWithRouter>
      <AppContent />
    </AppWithRouter>
  );
}

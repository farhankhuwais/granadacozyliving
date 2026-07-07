import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import App from "@/App";
import "@/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, retry: 1 },
  },
});

// Service worker update handler
(async () => {
  try {
    const { registerSW } = await import("virtual:pwa-register");
    let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;
    updateSW = registerSW({
      onNeedRefresh() {
        if (confirm("Update tersedia! Muat ulang halaman untuk menggunakan versi terbaru?")) {
          updateSW?.(true);
        }
      },
      onOfflineReady() {
        console.log("[PWA] App siap digunakan offline");
      },
    });
  } catch {
    console.log("[PWA] SW registration skipped");
  }
})();

console.log("[CozyLiving] main.tsx: rendering");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

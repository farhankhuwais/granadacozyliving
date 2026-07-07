import { useState, useEffect, useRef } from "react";
import { X, Download } from "lucide-react";

let deferredPromptGlobal: Event | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPromptGlobal = e;
  });
}

export default function PWABanner() {
  const deferredRef = useRef<Event | null>(deferredPromptGlobal);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e;
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (deferredRef.current || !("beforeinstallprompt" in window)) {
      setShowBanner(true);
    }

    // Always show banner on first visit
    if (!sessionStorage.getItem("pwa-visit-count")) {
      sessionStorage.setItem("pwa-visit-count", "1");
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    const event = deferredRef.current;
    if (event && "prompt" in event) {
      (event as any).prompt();
      const result = await (event as any).userChoice;
      if (result.outcome === "accepted") {
        setShowBanner(false);
        sessionStorage.setItem("pwa-banner-dismissed", "1");
        return;
      }
    }
    setShowGuide(true);
  }

  function handleDismiss() {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  }

  if (!showBanner) return null;

  if (showGuide) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[60] bg-primary px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-lg">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-white" />
            <div className="flex-1 text-sm text-white">
              <p className="font-semibold">Install aplikasi:</p>
              <ol className="mt-2 list-decimal pl-4 space-y-1 text-white/90">
                {isIOS ? (
                  <>
                    <li>Tap ikon Share <span className="inline-block text-base">⎋</span></li>
                    <li>Scroll ke bawah, tap "Add to Home Screen"</li>
                    <li>Tap "Add" di pojok kanan atas</li>
                  </>
                ) : (
                  <>
                    <li>Tap ikon ⋮ (3 titik) di pojok kanan atas browser</li>
                    <li>Tap "Install app" atau "Add to Home Screen"</li>
                    <li>Tap "Install"</li>
                  </>
                )}
              </ol>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-primary px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Download className="h-4 w-4 text-white" />
        </div>
        <p className="flex-1 text-sm font-medium text-white">
          Install aplikasi untuk akses cepat
        </p>
        <button
          onClick={handleInstall}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary"
        >
          Install
        </button>
        <button onClick={handleDismiss} className="text-white/70 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

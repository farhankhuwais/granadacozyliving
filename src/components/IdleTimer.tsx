import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 menit
const WARNING_BEFORE = 60 * 1000;    // 1 menit sebelum logout

export default function IdleTimer() {
  const { signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setInterval>>();
  const activeRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearInterval(warningRef.current);
    setShowWarning(false);

    if (!activeRef.current) return;

    timerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
      warningRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(warningRef.current);
            signOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT - WARNING_BEFORE);
  }, [signOut]);

  const handleContinue = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    activeRef.current = true;
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

    const handleActivity = () => {
      if (!showWarning) resetTimer();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      activeRef.current = false;
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearInterval(warningRef.current);
    };
  }, [resetTimer, showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 pb-20">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <LogOut className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Sesi akan berakhir</p>
            <p className="text-xs text-muted-foreground">
              Anda akan logout otomatis dalam {countdown} detik
            </p>
          </div>
        </div>
        <button
          onClick={handleContinue}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Lanjutkan Sesi
        </button>
      </div>
    </div>
  );
}

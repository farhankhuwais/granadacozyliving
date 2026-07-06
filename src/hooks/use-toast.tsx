import { createContext, useContext, useCallback, type ReactNode } from "react";

console.log("[CozyLiving] use-toast.tsx: loaded");

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const addToast = useCallback((message: string, type: ToastType = "info") => {
    console.log("[CozyLiving] Toast:", type, message);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

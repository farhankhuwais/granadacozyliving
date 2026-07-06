import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const typeStyles: Record<ToastType, string> = {
    success: "bg-green-900/90 border-green-700 text-green-300",
    error: "bg-red-900/90 border-red-700 text-red-300",
    info: "bg-blue-900/90 border-blue-700 text-blue-300",
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-up flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur ${typeStyles[toast.type]}`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.type === "success" && "✓ "}
            {toast.type === "error" && "✗ "}
            {toast.type === "info" && "ℹ "}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

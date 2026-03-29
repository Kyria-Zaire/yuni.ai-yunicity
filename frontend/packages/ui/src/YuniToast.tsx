"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clsx } from "clsx";

export type YuniToastVariant = "success" | "error" | "info" | "warning";

export interface YuniToastItem {
  id: string;
  message: string;
  variant: YuniToastVariant;
}

interface ToastContextValue {
  show: (toast: Omit<YuniToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

const variantStyles: Record<YuniToastVariant, string> = {
  success:
    "border-yuni-forest-300 bg-yuni-forest-50 text-yuni-forest-700",
  error:
    "border-yuni-terracotta-300 bg-yuni-terracotta-50 text-yuni-terracotta-900",
  info: "border-yuni-slate-300 bg-yuni-slate-50 text-yuni-slate-900",
  warning:
    "border-yuni-wheat-300 bg-yuni-wheat-100 text-yuni-slate-900",
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isAutoDismissVariant(v: YuniToastVariant): boolean {
  return v === "success" || v === "info";
}

export function YuniToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<YuniToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<YuniToastItem, "id">) => {
      const id = generateId();
      setToasts((prev) => {
        const next = [...prev, { ...toast, id }];
        return next.slice(-MAX_VISIBLE);
      });
      if (isAutoDismissVariant(toast.variant)) {
        const timer = setTimeout(() => remove(id), AUTO_DISMISS_MS);
        timers.current.set(id, timer);
      }
    },
    [remove],
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-0 sm:bottom-6 sm:right-6"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={clsx(
              "yuni-toast-item flex items-start justify-between gap-3 rounded-lg border px-4 py-3 font-body text-sm shadow-yuni-md",
              variantStyles[t.variant],
              "pointer-events-auto",
            )}
          >
            <span className="min-w-0 flex-1">{t.message}</span>
            {!isAutoDismissVariant(t.variant) ? (
              <button
                type="button"
                className="shrink-0 rounded-yuni-sm px-1.5 py-0.5 text-lg leading-none text-current hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Fermer la notification"
                onClick={() => remove(t.id)}
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useYuniToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useYuniToast must be used within YuniToastProvider");
  }
  return ctx;
}

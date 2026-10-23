"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Toast = {
  id: number;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  placement?: "top" | "bottom";
  passive?: boolean;
  ariaLabel?: string;
};

type ToastOptions = Omit<Toast, "id"> & { duration?: number };

type ToastContextValue = {
  showToast: (options: ToastOptions) => number;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** A small app-level feedback surface. It deliberately sits above sticky actions. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const dismiss = useCallback(
    (id: number) =>
      setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  );
  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      // Latest feedback replaces the previous notice rather than stacking over
      // a small screen. Repeated identical actions still get a fresh timer.
      setToasts([
        {
          id,
          label: options.label,
          actionLabel: options.actionLabel,
          onAction: options.onAction,
          placement: options.placement,
          passive: options.passive,
          ariaLabel: options.ariaLabel,
        },
      ]);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => dismiss(id), options.duration ?? 5000);
      return id;
    },
    [dismiss],
  );
  const value = useMemo(
    () => ({ showToast, dismissToast: dismiss }),
    [showToast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={toasts[0]?.placement === "top" ? "pointer-events-none fixed left-1/2 top-[max(.5rem,env(safe-area-inset-top))] z-[1300] w-max max-w-[calc(100vw-7rem)] -translate-x-1/2" : "pointer-events-none fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"}
        role="status"
        aria-label={toasts[0]?.ariaLabel ?? "Notification"}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${toast.passive ? "pointer-events-none" : "pointer-events-auto"} flex min-h-11 w-full max-w-md items-center gap-3 border border-sky-200/35 bg-slate-950/95 px-3 py-2 text-sm text-slate-100 shadow-xl backdrop-blur sm:w-auto`}
          >
            <span className="min-w-0 flex-1 break-words">{toast.label}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                className="min-h-11 shrink-0 px-2 font-semibold text-sky-200 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                onClick={() => {
                  toast.onAction?.();
                  dismiss(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            {!toast.passive && <button
              type="button"
              className="grid size-11 shrink-0 place-items-center text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

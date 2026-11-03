import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { type Toast, ToastContext, type ToastOptions } from "./toast-context.js";
import { ToastCard } from "./ToastCard.js";

/** More than this many at once is a pile nobody reads; the oldest make way. */
const MAX_TOASTS = 4;

function toastDuration(toast: ToastOptions): number | null {
  if (toast.duration !== undefined) return toast.duration;
  const reading = toast.tone === "danger" ? 10_000 : toast.tone === "warning" ? 8000 : 5000;
  return reading + (toast.action ? 3000 : 0);
}

/**
 * Shows the notifications raised with `useToast` in the bottom-right corner;
 * each one pauses while pointed at or focused. `WhisperinkProvider` already
 * includes it.
 * @category overlays
 */
export function ToastProvider({ uiId, uiDescription, uiComponentId, uiComponentDescription, children }: ({ children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("toast-provider", "Show temporary notifications", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((item) => item.id !== id)), []);
  const push = useCallback((toast: ToastOptions) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }].slice(-MAX_TOASTS));
    return () => dismiss(id);
  }, [dismiss]);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] grid w-80 max-w-[calc(100vw-2rem)] gap-2" aria-live="polite" {..._ui.attributes}>
        {toasts.map((toast) => <TimedToast key={toast.id} toast={toast} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

/** One live toast: its clock stops while it is pointed at or holds focus, so it cannot vanish mid-read. */
function TimedToast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [held, setHeld] = useState(false);
  const remaining = useRef(toastDuration(toast));
  useEffect(() => {
    if (held || remaining.current === null) return;
    const started = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      if (remaining.current !== null) remaining.current = Math.max(1000, remaining.current - (Date.now() - started));
    };
  }, [held, onDismiss, toast.id]);
  return (
    <div onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <ToastCard toast={toast} onClose={() => onDismiss(toast.id)} />
    </div>
  );
}

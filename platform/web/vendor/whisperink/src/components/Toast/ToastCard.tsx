import type { ReactNode } from "react";
import { CheckCircle, Info, Warning, X, XCircle } from "../../icons.js";
import { useText } from "../../text.js";
import type { Tone } from "../../tone.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Button } from "../Button/Button.js";
import { IconButton } from "../Button/IconButton.js";
import type { ToastOptions } from "./toast-context.js";

const toastIcons: Record<Tone, ReactNode> = {
  neutral: <Info className="text-fg-muted" />,
  success: <CheckCircle className="text-success" />,
  warning: <Warning className="text-warning" />,
  danger: <XCircle className="text-danger" />,
  info: <Info className="text-info" />,
};

/**
 * One notification as a card: tone icon, title, optional description and
 * action. `ToastProvider` renders these; use it directly only to show a
 * notification in place, as the showcase does.
 * @category overlays
 */
export function ToastCard({ uiId, uiDescription, uiComponentId, uiComponentDescription, toast, onClose }: ({ toast: ToastOptions; onClose?: () => void }) & UiMetadataProps) {
  const _ui = uiMetadata("toast-card", "Show a temporary notification", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const tone = toast.tone ?? "neutral";
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className="pointer-events-auto flex animate-fade-in items-start gap-3 rounded-[var(--card-radius)] border-[length:var(--card-border-width)] border-[rgb(var(--card-border-color))] bg-surface p-3.5 shadow-menu [&_svg]:size-4 [&_svg]:shrink-0" {..._ui.attributes}>
      <span className="mt-0.5">{toastIcons[tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-fg-muted">{toast.description}</p>}
        {toast.action && (
          <Button size="xs" variant="outline" className="mt-2" onClick={() => { toast.action?.onClick(); onClose?.(); }}>{toast.action.label}</Button>
        )}
      </div>
      {onClose && <IconButton label={text.actions.close} size="sm" onClick={onClose} className="-m-1.5 size-7"><X /></IconButton>}
    </div>
  );
}

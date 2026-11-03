import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { X } from "../../icons.js";
import { useText } from "../../text.js";
import type { Tone } from "../../tone.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";
import { alertTones } from "./alert-tones.js";

/**
 * Inline alert with icon, optional title, action row, and dismiss control.
 * @category feedback
 */
export function Alert({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  tone = "neutral",
  title,
  children,
  action,
  onClose,
  className,
}: ({
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("alert", "Explain a status or problem", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const { box, icon: Icon, iconClass } = alertTones[tone];
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex gap-3 rounded-[var(--alert-radius)] border-[length:var(--alert-border-width)] p-3.5 text-sm", box, className)} {..._ui.attributes}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-fg">{title}</p>}
        {children && <div className={cn("text-fg-muted", title && "mt-0.5")}>{children}</div>}
        {action && <div className="mt-2.5 flex gap-2">{action}</div>}
      </div>
      {onClose && <IconButton label={text.actions.close} size="sm" onClick={onClose} className="-m-1.5 size-7"><X /></IconButton>}
    </div>
  );
}

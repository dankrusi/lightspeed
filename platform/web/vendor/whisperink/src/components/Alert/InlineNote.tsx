import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import type { Tone } from "../../tone.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { alertTones } from "./alert-tones.js";

/**
 * Small inline validation or status note without a box.
 * @category feedback
 */
export function InlineNote({ uiId, uiDescription, uiComponentId, uiComponentDescription, tone = "neutral", children, className }: ({ tone?: Tone; children: ReactNode; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("inline-note", "Show contextual guidance", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const { icon: Icon, iconClass } = alertTones[tone];
  const text = { neutral: "text-fg-muted", success: "text-success-fg", warning: "text-warning-fg", danger: "text-danger-fg", info: "text-info-fg" }[tone];
  return (
    <p className={cn("flex items-center gap-1.5 text-xs", text, className)} {..._ui.attributes}>
      <Icon className={cn("size-3.5", iconClass)} aria-hidden="true" />
      {children}
    </p>
  );
}

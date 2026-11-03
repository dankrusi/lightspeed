import { cn } from "../../cn.js";
import type { Tone } from "../../tone.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * A measured value, or an indeterminate indicator when the total is not known.
 *
 * The bar stays neutral on its own, so an upload that reaches the end looks
 * finished, not failed. A budget or a quota, where filling up is the problem,
 * passes `thresholds`: the shares of `max` from which the bar turns to warning
 * and to danger. An explicit `tone` overrides both.
 * @category feedback
 */
export function Progress({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  value,
  max = 100,
  label,
  detail,
  tone,
  thresholds,
  size = "md",
  className,
}: ({
  value?: number;
  max?: number;
  label?: string;
  detail?: string;
  tone?: Tone;
  /** Shares of `max` (0–1) from which the bar turns to warning and to danger, e.g. `{ warning: 0.85, danger: 1 }` for a budget. */
  thresholds?: { warning?: number; danger?: number };
  size?: "sm" | "md";
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("progress", "Show progress toward completion", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const indeterminate = value === undefined;
  const ratio = indeterminate ? 0 : Math.min(1, Math.max(0, value / max));
  const reached = (share: number | undefined) => share !== undefined && !indeterminate && ratio >= Math.min(1, share);
  const resolved: Tone = tone ?? (reached(thresholds?.danger) ? "danger" : reached(thresholds?.warning) ? "warning" : "neutral");
  const fill = { neutral: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info" }[resolved];
  return (
    <div className={className} {..._ui.attributes}>
      {(label || detail) && (
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="font-medium">{label}</span>
          <span className="tabular-nums text-fg-muted">{detail}</span>
        </div>
      )}
      <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-valuetext={detail} className={cn("w-full overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1" : "h-1.5")}>
        <div className={cn("h-full rounded-full", indeterminate ? "animate-pulse motion-reduce:animate-none" : "transition-[width]", fill)} style={{ width: indeterminate ? "100%" : `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

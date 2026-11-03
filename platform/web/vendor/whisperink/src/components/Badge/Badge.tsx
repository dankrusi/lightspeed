import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { X } from "../../icons.js";
import { useText } from "../../text.js";
import type { Tone } from "../../tone.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-fg-muted",
  success: "bg-success-soft text-success-fg",
  warning: "bg-warning-soft text-warning-fg",
  danger: "bg-danger-soft text-danger-fg",
  info: "bg-info-soft text-info-fg",
};

const dots: Record<Tone, string> = {
  neutral: "bg-fg-subtle",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

/**
 * Status label. `dot` renders a leading indicator, `outline` swaps the fill for a ring.
 * The inset border follows `--badge-border-width` and `--badge-border-color`.
 *
 * `onRemove` turns it into a chip that can be taken away — an active filter, a
 * chosen tag — with a dismiss button that is a real, labelled, focusable control.
 * @category data
 */
export function Badge({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  tone = "neutral",
  dot = false,
  outline = false,
  size = "md",
  onRemove,
  removeLabel,
  className,
  children,
  ...props
}: (HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
  outline?: boolean;
  size?: "sm" | "md";
  onRemove?: () => void;
  /** Accessible name of the dismiss button; name what is removed when several chips sit together. */
  removeLabel?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("badge", "Show a status or category", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--badge-radius)] font-medium ring-[length:var(--badge-border-width)] ring-inset ring-[rgb(var(--badge-border-color))]",
        size === "sm" ? "h-5 px-2 text-2xs" : "h-6 px-2.5 text-xs",
        onRemove && (size === "sm" ? "pr-0.5" : "pr-1"),
        outline ? "bg-transparent text-fg" : tones[tone],
        className,
      )}
      {...props} {..._ui.attributes}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} aria-hidden="true" />}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? text.actions.remove}
          className="focus-ring -ml-0.5 grid size-4 shrink-0 place-items-center rounded-full opacity-60 transition-opacity hover:bg-fg/10 hover:opacity-100"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

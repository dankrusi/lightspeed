import type { ComponentProps, ReactNode } from "react";
import { chain, useTooltip } from "../../floating.js";
import { CircleNotch } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-classes.js";

/**
 * Square icon-only button. The label is its accessible name and its tooltip,
 * shown on hover and on keyboard focus alike, so whoever cannot guess the icon
 * can find out what it does without a mouse.
 * @category actions
 */
export function IconButton({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  label,
  variant = "ghost",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  ...props
}: (ComponentProps<"button"> & { label: string; variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("icon-button", "Trigger an action using an icon", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const tip = useTooltip(label);
  return (
    <button
      type="button"
      aria-label={label}
      className={buttonClasses(variant, size, className, true)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
      onPointerEnter={chain(onPointerEnter, tip.trigger.onPointerEnter)}
      onPointerLeave={chain(onPointerLeave, tip.trigger.onPointerLeave)}
      onPointerDown={chain(onPointerDown, tip.trigger.onPointerDown)}
      onFocus={chain(onFocus, tip.trigger.onFocus)}
      onBlur={chain(onBlur, tip.trigger.onBlur)} {..._ui.attributes}
    >
      {loading ? <CircleNotch className="animate-spin" aria-hidden="true" /> : children}
      {tip.bubble}
    </button>
  );
}

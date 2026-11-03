import type { ComponentProps } from "react";
import { cn } from "../../cn.js";
import { CircleNotch } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-classes.js";

/**
 * `loading` disables the button and shows a spinner. The spinner takes the
 * place of the button's icon rather than joining it, so a button with an icon
 * keeps its width and the buttons beside it stay where they were.
 * @category actions
 */
export function Button({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: (ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) & UiMetadataProps) {
  const _ui = uiMetadata("button", "Trigger an action", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <button type={type} className={buttonClasses(variant, size, cn(loading && "[&>[data-spinner]+svg]:hidden", className))} disabled={disabled || loading} aria-busy={loading || undefined} {...props} {..._ui.attributes}>
      {loading && <CircleNotch data-spinner="" className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

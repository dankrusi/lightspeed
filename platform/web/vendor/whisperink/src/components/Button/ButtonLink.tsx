import type { ComponentProps } from "react";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-classes.js";

/**
 * A link that looks like a button. `disabled` takes its address away, so it can be neither followed nor focused.
 * @category actions
 */
export function ButtonLink({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  href,
  ...props
}: (ComponentProps<"a"> & { variant?: ButtonVariant; size?: ButtonSize; disabled?: boolean }) & UiMetadataProps) {
  const _ui = uiMetadata("button-link", "Navigate with button styling", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <a className={buttonClasses(variant, size, className)} href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...props} {..._ui.attributes} />;
}

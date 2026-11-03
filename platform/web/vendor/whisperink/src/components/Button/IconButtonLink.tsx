import type { ComponentProps, ReactNode } from "react";
import { chain, useTooltip } from "../../floating.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-classes.js";

/**
 * Square icon-only link: an `IconButton` that navigates or downloads. Use it wherever a row
 * action is a URL rather than a handler, so it keeps link affordances (middle-click, open in
 * a new tab, `download`) while looking exactly like its button sibling.
 * @category actions
 */
export function IconButtonLink({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  className,
  children,
  href,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  ...props
}: (ComponentProps<"a"> & { label: string; variant?: ButtonVariant; size?: ButtonSize; disabled?: boolean; children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("icon-button-link", "Navigate using an icon", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const tip = useTooltip(label);
  return (
    <a
      aria-label={label}
      className={buttonClasses(variant, size, className, true)}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      {...props}
      onPointerEnter={chain(onPointerEnter, tip.trigger.onPointerEnter)}
      onPointerLeave={chain(onPointerLeave, tip.trigger.onPointerLeave)}
      onPointerDown={chain(onPointerDown, tip.trigger.onPointerDown)}
      onFocus={chain(onFocus, tip.trigger.onFocus)}
      onBlur={chain(onBlur, tip.trigger.onBlur)} {..._ui.attributes}
    >
      {children}
      {tip.bubble}
    </a>
  );
}

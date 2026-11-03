import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { cn } from "../../cn.js";
import { Check } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Menu entry. Pass `href` for entries that navigate, so they keep link
 * affordances (middle-click, open in new tab) while staying a menu item;
 * `onClick` still fires and a client-side router can `preventDefault()`.
 *
 * `checked` makes it one of a set of choices: it carries a tick when it is the
 * one in force and keeps the same indent when it is not.
 * @category menu
 */
export function MenuItem({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  icon,
  shortcut,
  danger,
  checked,
  href,
  className,
  children,
  ...props
}: (Omit<ComponentProps<"button">, "onClick"> & {
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  checked?: boolean;
  href?: string;
  /** Receives the anchor event for `href` entries, so a router can `preventDefault()`. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}) & UiMetadataProps) {
  const _ui = uiMetadata("menu-item", "Choose a menu action", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const classes = cn(
    "flex h-8 w-full items-center gap-2.5 rounded px-2 text-left text-base outline-none transition-colors hover:bg-subtle focus-visible:bg-subtle disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted",
    danger && "text-danger-fg hover:bg-danger-soft focus-visible:bg-danger-soft [&_svg]:text-danger-fg",
    className,
  );
  const role = checked === undefined ? "menuitem" : "menuitemcheckbox";
  const content = (
    <>
      {checked !== undefined && (checked ? <Check aria-hidden="true" /> : <span className="size-4 shrink-0" aria-hidden="true" />)}
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="text-xs text-fg-subtle">{shortcut}</span>}
    </>
  );
  if (href !== undefined) {
    const { disabled, type: _type, ...anchorProps } = props;
    return (
      <a
        role={role}
        aria-checked={checked}
        // A disabled entry goes nowhere, so it carries no address to follow.
        href={disabled ? undefined : href}
        aria-disabled={disabled || undefined}
        className={classes}
        {...(anchorProps as ComponentProps<"a">)} {..._ui.attributes}
      >
        {content}
      </a>
    );
  }
  return (
    <button type="button" role={role} aria-checked={checked} className={classes} {...props} {..._ui.attributes}>
      {content}
    </button>
  );
}

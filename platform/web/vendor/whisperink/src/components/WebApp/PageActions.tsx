import { useMemo } from "react";
import { cn } from "../../cn.js";
import { DotsThree } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import type { ButtonVariant } from "../Button/button-classes.js";
import { Button } from "../Button/Button.js";
import { ButtonGroup } from "../Button/ButtonGroup.js";
import { ButtonLink } from "../Button/ButtonLink.js";
import { IconButton } from "../Button/IconButton.js";
import { Menu } from "../Menu/Menu.js";
import { MenuItem } from "../Menu/MenuItem.js";
import { MenuSeparator } from "../Menu/MenuSeparator.js";
import type { PageAction } from "./page-actions.js";

export type PageActionsLayout = {
  visiblePrimary: PageAction[];
  visibleSecondary: PageAction[];
  overflow: PageAction[];
};

/** Splits actions into visible buttons and overflow entries: sorted by priority, capped per kind. */
export function layoutPageActions(actions: readonly PageAction[], maxPrimary = 1, maxSecondary = 1): PageActionsLayout {
  const sorted = [...actions].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const primaries = sorted.filter((action) => action.kind === "primary");
  const secondaries = sorted.filter((action) => action.kind !== "primary");
  return {
    visiblePrimary: primaries.slice(0, Math.max(0, maxPrimary)),
    visibleSecondary: secondaries.slice(0, Math.max(0, maxSecondary)),
    overflow: [...primaries.slice(Math.max(0, maxPrimary)), ...secondaries.slice(Math.max(0, maxSecondary))],
  };
}

/**
 * Renders page actions as one attached group `[⋯ | secondary | primary]`
 * (or as separate buttons with `grouped={false}`). Below the `md` breakpoint
 * the visible secondaries move into the overflow menu.
 * @category shell
 */
export function PageActions({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  actions,
  maxPrimary = 1,
  maxSecondary = 1,
  overflowLabel,
  grouped = true,
  className,
}: ({
  actions: readonly PageAction[];
  maxPrimary?: number;
  maxSecondary?: number;
  overflowLabel?: string;
  /** Attach all buttons into one `ButtonGroup` (default) or keep them as separate buttons. */
  grouped?: boolean;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("page-actions", "Show page actions", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const { visiblePrimary, visibleSecondary, overflow } = useMemo(() => layoutPageActions(actions, maxPrimary, maxSecondary), [actions, maxPrimary, maxSecondary]);
  if (actions.length === 0) return null;
  const overflowPrimaries = overflow.filter((action) => action.kind === "primary");
  const overflowSecondaries = overflow.filter((action) => action.kind !== "primary");
  const hasMenu = overflow.length > 0 || visibleSecondary.length > 0;
  const metadata = (action: PageAction): UiMetadataProps => ({
    uiId: action.uiId,
    uiDescription: action.uiDescription,
    uiComponentId: action.uiComponentId,
    uiComponentDescription: action.uiComponentDescription,
  });
  const item = (action: PageAction, extraClass?: string) => (
    <MenuItem key={action.id} {...metadata(action)} icon={action.icon} shortcut={action.shortcut} danger={action.danger} href={action.href} disabled={action.disabled || action.loading} onClick={action.onClick} className={extraClass}>
      {action.label}
    </MenuItem>
  );
  const menu = hasMenu && (
    <Menu
      align="start"
      trigger={({ toggle, open }) => (
        <IconButton label={overflowLabel ?? text.pageActions.more} size="sm" variant="outline" onClick={toggle} aria-expanded={open} aria-haspopup="menu" className={cn(overflow.length === 0 && "md:hidden")}>
          <DotsThree />
        </IconButton>
      )}
    >
      {overflowPrimaries.map((action) => item(action))}
      {overflowPrimaries.length > 0 && (visibleSecondary.length > 0 || overflowSecondaries.length > 0) && <MenuSeparator />}
      {visibleSecondary.map((action) => item(action, "md:hidden"))}
      {overflowSecondaries.map((action) => item(action))}
    </Menu>
  );
  /** One visible action; `collapse` marks the secondaries that fold into the menu below `md`. */
  const button = (action: PageAction, variant: ButtonVariant, collapse: boolean) => {
    const shared = {
      ...metadata(action),
      variant,
      size: "sm" as const,
      onClick: action.onClick,
      title: action.shortcut ? `${action.label} (${action.shortcut})` : undefined,
      "data-collapse": collapse ? "md" : undefined,
      className: cn(collapse && "max-md:hidden", action.danger && variant === "outline" && "text-danger-fg hover:bg-danger-soft [&_svg]:text-danger-fg"),
    };
    const label = <>{action.icon}{action.label}</>;
    return action.href !== undefined ? (
      <ButtonLink key={action.id} href={action.href} disabled={action.disabled || action.loading} {...shared}>{label}</ButtonLink>
    ) : (
      <Button key={action.id} disabled={action.disabled} loading={action.loading} {...shared}>{label}</Button>
    );
  };
  const secondaries = visibleSecondary.map((action) => button(action, "outline", true));
  const primaries = visiblePrimary.map((action) => button(action, action.danger ? "danger" : "primary", false));
  // With no overflow the "…" trigger exists only below `md`; keep it out of the
  // attached group so the first visible button still gets its left radius.
  const mobileOnlyMenu = overflow.length === 0;
  return (
    <div className={cn("flex items-center gap-1.5", className)} role="group" aria-label={text.pageActions.label} {..._ui.attributes}>
      {grouped ? (
        <>
          {mobileOnlyMenu && menu}
          <ButtonGroup>
            {!mobileOnlyMenu && menu}
            {secondaries}
            {primaries}
          </ButtonGroup>
        </>
      ) : (
        <>
          {menu}
          {secondaries}
          {primaries}
        </>
      )}
    </div>
  );
}

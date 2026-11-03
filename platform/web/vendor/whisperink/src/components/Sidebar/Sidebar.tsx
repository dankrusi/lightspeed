import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { chain, useTooltip } from "../../floating.js";
import { SidebarSimple } from "../../icons.js";
import { useText } from "../../text.js";
import type { Tone } from "../../tone.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";

export type NavItem = {
  key: string;
  label: string;
  icon: ReactNode;
  count?: number;
  /** Attention marker for the section, e.g. `warning` while it has open issues: a dot before the count, and on the icon while the sidebar is collapsed. */
  status?: Tone;
  /** What the marker means, for assistive technology, e.g. "2 values missing". */
  statusLabel?: string;
  /** Renders the entry as a real link so middle-click and "open in new tab" work. */
  href?: string;
};

const statusDots: Record<Tone, string> = { neutral: "bg-fg-subtle", success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info" };
export type NavGroup = { key: string; label?: string; items: readonly NavItem[] };

/** One navigation entry. Collapsed to its icon, it names itself in a tooltip beside the rail. */
function SidebarEntry({
  item,
  selected,
  collapsed,
  onSelect,
  onPrefetch,
}: {
  item: NavItem;
  selected: boolean;
  collapsed: boolean;
  onSelect?: (key: string) => void;
  onPrefetch?: (key: string) => void;
}) {
  const tip = useTooltip(collapsed ? item.label : null, { side: "right" });
  const prefetch = onPrefetch ? () => onPrefetch(item.key) : undefined;
  const shared = {
    "aria-label": collapsed ? item.label : undefined,
    "aria-current": selected ? ("page" as const) : undefined,
    onPointerEnter: chain(prefetch, tip.trigger.onPointerEnter),
    onPointerLeave: tip.trigger.onPointerLeave,
    onPointerDown: tip.trigger.onPointerDown,
    onFocus: chain(prefetch, tip.trigger.onFocus),
    onBlur: tip.trigger.onBlur,
    className: cn(
      "focus-ring flex h-8 w-full items-center gap-2.5 rounded px-2.5 text-left text-base transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
      selected ? "bg-subtle font-medium text-fg [&_svg]:text-fg" : "text-fg-muted hover:bg-subtle/70 hover:text-fg [&_svg]:text-fg-subtle",
      collapsed && "justify-center px-0",
    ),
  };
  const content = (
    <>
      {collapsed && item.status ? (
        <span className="relative inline-flex">{item.icon}<span className={cn("absolute -right-1 -top-1 size-2 rounded-full ring-2 ring-surface", statusDots[item.status])} aria-hidden="true" /></span>
      ) : item.icon}
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.status && <span className={cn("size-1.5 shrink-0 rounded-full", statusDots[item.status])} aria-hidden="true" />}
      {item.status && item.statusLabel && <span className="sr-only">{item.statusLabel}</span>}
      {!collapsed && item.count !== undefined && <span className="text-xs tabular-nums text-fg-subtle">{item.count}</span>}
      {tip.bubble}
    </>
  );
  if (item.href === undefined) return <button type="button" onClick={() => onSelect?.(item.key)} {...shared}>{content}</button>;
  return (
    // Plain left clicks go to `onSelect`; modified clicks stay native.
    <a
      href={item.href}
      onClick={(event) => {
        if (!onSelect || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onSelect(item.key);
      }}
      {...shared}
    >
      {content}
    </a>
  );
}

/**
 * Main navigation of the app frame: grouped entries that collapse to an icon
 * rail. Usually rendered by `WebApp`.
 * @category navigation
 */
export function Sidebar({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  groups,
  active,
  onSelect,
  onPrefetch,
  collapsed = false,
  onCollapse,
  className,
  footer,
}: ({
  groups: readonly NavGroup[];
  active: string;
  onSelect?: (key: string) => void;
  /** Fired when an entry is hovered or focused, so the app can warm its code and data. */
  onPrefetch?: (key: string) => void;
  collapsed?: boolean;
  onCollapse?: () => void;
  className?: string;
  footer?: ReactNode;
}) & UiMetadataProps) {
  const _ui = uiMetadata("sidebar", "Navigate application sections", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-surface", collapsed ? "w-14" : "w-60", className)} {..._ui.attributes}>
      <nav className="scrollbar-thin flex-1 overflow-y-auto p-2" aria-label={text.nav.mainNavigation}>
        {groups.map((group) => (
          <div key={group.key} className="mb-4 last:mb-0">
            {group.label && !collapsed && <p className="mb-1 px-2.5 pt-1 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{group.label}</p>}
            <ul className="grid gap-0.5">
              {group.items.map((item) => (
                <li key={item.key}>
                  <SidebarEntry item={item} selected={item.key === active} collapsed={collapsed} onSelect={onSelect} onPrefetch={onPrefetch} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {(footer || onCollapse) && (
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          {!collapsed && footer}
          {onCollapse && <IconButton label={collapsed ? text.nav.expandSidebar : text.nav.collapseSidebar} size="sm" onClick={onCollapse} aria-expanded={!collapsed} className={cn("ml-auto", collapsed && "mx-auto")}><SidebarSimple className={cn(collapsed && "rotate-180")} /></IconButton>}
        </div>
      )}
    </aside>
  );
}

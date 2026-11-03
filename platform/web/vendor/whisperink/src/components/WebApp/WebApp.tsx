import { type CSSProperties, type ReactElement, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { useKeyLayer } from "../../floating.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { AppHeader } from "../AppHeader/AppHeader.js";
import type { Crumb } from "../Breadcrumbs/Breadcrumbs.js";
import { type NavGroup, Sidebar } from "../Sidebar/Sidebar.js";
import { type PageAction, PageActionsContext, type Registry } from "./page-actions.js";
import { PageActions } from "./PageActions.js";

export type WebAppProps = ({
  brand?: ReactNode;
  /** Square brand mark left of `brand`; pass `null` for products that carry their logo in `brand`. */
  mark?: ReactNode;
  navigation: readonly NavGroup[];
  /** Key of the active navigation item. */
  active: string;
  onNavigate?: (key: string) => void;
  /** Fired when a navigation entry is hovered or focused, so the app can warm its code and data. */
  onPrefetch?: (key: string) => void;
  /** Crumbs, or a ready-made element for apps that derive the trail themselves. */
  breadcrumbs?: readonly Crumb[] | ReactElement;
  /** Hands breadcrumb clicks to a client-side router instead of the browser. Ignored for an element. */
  onNavigateBreadcrumb?: (item: Crumb) => void;
  /** Global page actions; pages can add more with `usePageActions`. */
  actions?: readonly PageAction[];
  maxPrimary?: number;
  maxSecondary?: number;
  /** Renders the global search control; `false` for apps without one. */
  search?: boolean;
  onSearch?: () => void;
  /** Renders the notification bell; `false` for apps without notifications. */
  showNotifications?: boolean;
  notifications?: number;
  onNotifications?: () => void;
  /** The signed-in person; without one the header shows no account. */
  user?: { name: string; initials: string; avatarUrl?: string };
  /** The account menu's entries, for a product with entries of its own. */
  userMenu?: ReactNode;
  /** Built-in account menu entries, one per handler given; without any the account opens nothing. */
  onProfile?: () => void;
  onSettings?: () => void;
  onSignOut?: () => void;
  sidebarFooter?: ReactNode;
  /** Controlled sidebar state; omit for internal state starting at `defaultCollapsed`. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  children: ReactNode;
  /** Classes for the scrolling `<main>`; default adds page padding. */
  contentClassName?: string;
  className?: string;
  style?: CSSProperties;
}) & UiMetadataProps;

/**
 * Complete web-application frame: header (brand, breadcrumbs, page actions,
 * search, notifications, profile), collapsible sidebar navigation and the
 * scrolling page area. Page-level functions go into `actions`, so every screen
 * places save/delete/export in the same spot.
 *
 * The frame owns the scrolling area, so it also owns what a router cannot
 * reach from outside: a new destination starts at the top, the first Tab stop
 * is a link that skips the header and navigation, and below `lg` the
 * navigation is a drawer that takes focus, closes on Escape and hands focus back.
 * @category shell
 */
export function WebApp({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  brand,
  mark,
  navigation,
  active,
  onNavigate,
  onPrefetch,
  breadcrumbs,
  onNavigateBreadcrumb,
  actions = [],
  maxPrimary = 1,
  maxSecondary = 1,
  search,
  onSearch,
  showNotifications,
  notifications,
  onNotifications,
  user,
  userMenu,
  onProfile,
  onSettings,
  onSignOut,
  sidebarFooter,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  defaultCollapsed = false,
  children,
  contentClassName,
  className,
  style,
}: (WebAppProps) & UiMetadataProps) {
  const _ui = uiMetadata("web-app", "Frame a web application", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = (next: boolean) => {
    if (controlledCollapsed === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const mainId = useId();
  /** Dismissed without choosing anything: focus goes back to the button that opened it. */
  const closeDrawer = useCallback(() => {
    setMobileOpen(false);
    frame.current?.querySelector<HTMLElement>("[data-sidebar-toggle]")?.focus();
  }, []);
  // The drawer is a layer like any other: Escape closes it, and only it.
  useKeyLayer(mobileOpen, (event) => {
    if (event.key !== "Escape") return false;
    closeDrawer();
    return true;
  });
  useEffect(() => {
    if (!mobileOpen) return;
    // Opening it is asking for the navigation, so that is where focus goes.
    (frame.current?.querySelector<HTMLElement>("aside [aria-current='page']") ?? frame.current?.querySelector<HTMLElement>("aside a, aside button"))?.focus();
    // Widened past the breakpoint, the sidebar is back in the layout and the drawer has no business left.
    const wide = window.matchMedia("(min-width: 1024px)");
    const onChange = () => { if (wide.matches) setMobileOpen(false); };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [mobileOpen]);
  // A new destination starts at its top rather than wherever the last one was left.
  useEffect(() => { main.current?.scrollTo({ top: 0 }); }, [active]);
  const [registered, setRegistered] = useState<Record<string, readonly PageAction[]>>({});
  const registry = useMemo<Registry>(() => ({
    register: (owner, list) => setRegistered((current) => (current[owner] === list ? current : { ...current, [owner]: list })),
    unregister: (owner) => setRegistered((current) => { if (!(owner in current)) return current; const next = { ...current }; delete next[owner]; return next; }),
  }), []);
  const allActions = useMemo(() => [...actions, ...Object.values(registered).flat()], [actions, registered]);
  const navigate = useCallback((key: string) => {
    onNavigate?.(key);
    if (!mobileOpen) return;
    // Chosen from the drawer: it closes, and focus follows to the page that was asked for.
    setMobileOpen(false);
    main.current?.focus();
  }, [onNavigate, mobileOpen]);

  return (
    <PageActionsContext.Provider value={registry}>
      <div ref={frame} className={cn("relative flex h-full min-h-0 flex-col bg-canvas text-fg", className)} style={style} {..._ui.attributes}>
        <a
          href={`#${mainId}`}
          onClick={(event) => { event.preventDefault(); main.current?.focus(); }}
          className="focus-ring sr-only rounded bg-surface px-3 py-2 text-sm font-medium text-fg shadow-md focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50"
        >
          {text.nav.skipToContent}
        </a>
        <AppHeader
          brand={brand}
          mark={mark}
          breadcrumbs={breadcrumbs}
          onNavigateBreadcrumb={onNavigateBreadcrumb}
          actions={<PageActions actions={allActions} maxPrimary={maxPrimary} maxSecondary={maxSecondary} />}
          onToggleSidebar={() => setMobileOpen((open) => !open)}
          sidebarOpen={mobileOpen}
          search={search}
          onSearch={onSearch}
          showNotifications={showNotifications}
          notifications={notifications}
          onNotifications={onNotifications}
          user={user}
          menu={userMenu}
          onProfile={onProfile}
          onSettings={onSettings}
          onSignOut={onSignOut}
          className="shrink-0"
        />
        <div className="relative flex min-h-0 flex-1">
          <Sidebar
            groups={navigation}
            active={active}
            onSelect={navigate}
            onPrefetch={onPrefetch}
            // The drawer always shows the full navigation: a rail of icons is a desktop saving, not a mobile one.
            collapsed={collapsed && !mobileOpen}
            onCollapse={mobileOpen ? undefined : () => setCollapsed(!collapsed)}
            footer={sidebarFooter}
            // One or the other, never both: `hidden` beside `flex` wins, and the drawer would stay invisible.
            className={cn("shrink-0", mobileOpen ? "absolute inset-y-0 left-0 z-30 shadow-lg lg:static lg:shadow-none" : "hidden lg:flex")}
          />
          {mobileOpen && <button type="button" aria-label={text.nav.closeNavigation} onClick={closeDrawer} className="absolute inset-0 z-20 bg-overlay/40 lg:hidden" />}
          <main ref={main} id={mainId} tabIndex={-1} className={cn("scrollbar-thin min-w-0 flex-1 overflow-y-auto outline-none", contentClassName ?? "p-4 sm:p-8")}>{children}</main>
        </div>
      </div>
    </PageActionsContext.Provider>
  );
}

import { type ReactElement, type ReactNode, useEffect, useRef } from "react";
import { cn } from "../../cn.js";
import { Bell, CaretDown, Gear, List as MenuIcon, MagnifyingGlass, SignOut, User } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Avatar } from "../Avatar/Avatar.js";
import { Breadcrumbs, type Crumb } from "../Breadcrumbs/Breadcrumbs.js";
import { IconButton } from "../Button/IconButton.js";
import { Kbd } from "../Kbd/Kbd.js";
import { Menu } from "../Menu/Menu.js";
import { MenuItem } from "../Menu/MenuItem.js";
import { MenuSeparator } from "../Menu/MenuSeparator.js";

/** The modifier people expect for shortcuts: Command on Apple systems, Control everywhere else. */
const apple = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

/**
 * Top bar of the app frame: brand, breadcrumbs, page actions, global search,
 * notifications and the account menu. Usually rendered by `WebApp`.
 * @category shell
 */
export function AppHeader({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  brand = "Versavolta GmbH",
  mark = <span className="grid size-7 place-items-center rounded-md bg-primary text-2xs font-bold text-primary-fg">V</span>,
  breadcrumbs,
  onNavigateBreadcrumb,
  actions,
  className,
  onToggleSidebar,
  sidebarOpen,
  search = true,
  searchLabel,
  searchPlaceholder,
  onSearch,
  showNotifications = true,
  notifications = 0,
  onNotifications,
  user,
  menu,
  onProfile,
  onSettings,
  onSignOut,
}: ({
  brand?: ReactNode;
  /** Square brand mark left of `brand`; pass `null` for products that carry their logo in `brand`. */
  mark?: ReactNode;
  /** Crumbs, or a ready-made element for apps that derive the trail themselves. */
  breadcrumbs?: readonly Crumb[] | ReactElement;
  /** Hands breadcrumb clicks to a client-side router instead of the browser. Ignored for an element. */
  onNavigateBreadcrumb?: (item: Crumb) => void;
  /** Global page actions (see `PageActions` / `WebApp`); rendered left of search, notifications and profile. */
  actions?: ReactNode;
  className?: string;
  onToggleSidebar?: () => void;
  /** Whether the navigation that button toggles is showing, so the button can say so. */
  sidebarOpen?: boolean;
  /** Renders the global search control; `false` for apps without one. */
  search?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  /**
   * Opens the global search / command palette. Given it, the header also
   * answers the shortcut it shows: ⌘K on Apple systems, Ctrl+K elsewhere.
   */
  onSearch?: () => void;
  /** Renders the notification bell; `false` for apps without notifications. */
  showNotifications?: boolean;
  /** Unread count shown on the bell. */
  notifications?: number;
  onNotifications?: () => void;
  /** The signed-in person. Without one the header shows no account. */
  user?: { name: string; initials: string; avatarUrl?: string };
  /** The account menu's entries, for a product with entries of its own. */
  menu?: ReactNode;
  /**
   * The built-in account menu has one entry per handler given here, and
   * without any (or a `menu`) the account is shown but opens nothing: an entry
   * that does nothing is never offered.
   */
  onProfile?: () => void;
  onSettings?: () => void;
  onSignOut?: () => void;
}) & UiMetadataProps) {
  const _ui = uiMetadata("app-header", "Show application navigation and actions", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const crumbs = Array.isArray(breadcrumbs) ? (breadcrumbs as readonly Crumb[]) : null;
  // Held in a ref so an inline handler does not re-subscribe the shortcut on every render.
  const openSearch = useRef(onSearch);
  openSearch.current = onSearch;
  const shortcut = search && Boolean(onSearch);
  const accountMenu = menu ?? (onProfile || onSettings || onSignOut ? (
    <>
      {onProfile && <MenuItem icon={<User />} onClick={onProfile}>{text.nav.profile}</MenuItem>}
      {onSettings && <MenuItem icon={<Gear />} onClick={onSettings}>{text.nav.settings}</MenuItem>}
      {onSignOut && (onProfile || onSettings) && <MenuSeparator />}
      {onSignOut && <MenuItem icon={<SignOut />} onClick={onSignOut}>{text.nav.signOut}</MenuItem>}
    </>
  ) : null);
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || event.altKey || event.shiftKey || !(apple ? event.metaKey : event.ctrlKey)) return;
      event.preventDefault();
      openSearch.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);
  return (
    <header className={cn("flex h-14 items-center gap-3 border-b border-border bg-surface px-4", className)} {..._ui.attributes}>
      {onToggleSidebar && <IconButton label={text.nav.navigation} size="sm" onClick={onToggleSidebar} aria-expanded={sidebarOpen} data-sidebar-toggle="" className="lg:hidden"><MenuIcon /></IconButton>}
      <div className="flex min-w-0 items-center gap-3">
        {/* The trail beside it gives way on a narrow screen; the mark does not. */}
        {mark && <span className="flex shrink-0 items-center">{mark}</span>}
        <span className="hidden truncate text-sm font-semibold sm:block">{brand}</span>
        {breadcrumbs && <span className="hidden h-4 w-px bg-border-strong sm:block" />}
        {crumbs ? <Breadcrumbs items={crumbs} onNavigate={onNavigateBreadcrumb} className="hidden sm:block" /> : (breadcrumbs as ReactNode)}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        {actions}
        {actions && <span className="mx-1.5 hidden h-5 w-px bg-border md:block" aria-hidden="true" />}
        {search && (
          <>
            <button type="button" onClick={onSearch} aria-label={searchLabel ?? text.search.label} aria-keyshortcuts={shortcut ? (apple ? "Meta+K" : "Control+K") : undefined} className="focus-ring hidden h-8 w-56 items-center gap-2 rounded border border-border bg-canvas px-2.5 text-sm text-fg-muted transition-colors hover:border-border-strong md:flex">
              <MagnifyingGlass className="size-4" />
              <span className="flex-1 truncate text-left">{searchPlaceholder ?? text.search.placeholder}</span>
              {shortcut && <Kbd>{apple ? "⌘K" : "Ctrl K"}</Kbd>}
            </button>
            {/* Below `md` there is no room for the field, but search must not disappear with it. */}
            <IconButton label={searchLabel ?? text.search.label} size="sm" onClick={onSearch} className="md:hidden"><MagnifyingGlass /></IconButton>
          </>
        )}
        {showNotifications && (
          <IconButton label={text.nav.notifications(notifications)} size="sm" onClick={onNotifications} className="relative">
            <Bell />
            {notifications > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" aria-hidden="true" />}
          </IconButton>
        )}
        {user && (accountMenu ? (
          <Menu
            trigger={({ toggle, open }) => (
              <button type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={open} aria-label={text.nav.account(user.name)} className="focus-ring flex shrink-0 items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-subtle sm:pr-2">
                <Avatar initials={user.initials} src={user.avatarUrl} size="sm" />
                <span className="hidden whitespace-nowrap text-sm font-medium xl:block">{user.name}</span>
                <CaretDown className="size-3.5 text-fg-subtle max-sm:hidden" />
              </button>
            )}
          >
            {accountMenu}
          </Menu>
        ) : (
          <span className="flex shrink-0 items-center gap-2 p-0.5 sm:pr-2">
            <Avatar initials={user.initials} src={user.avatarUrl} size="sm" label={user.name} />
            <span className="hidden whitespace-nowrap text-sm font-medium xl:block" aria-hidden="true">{user.name}</span>
          </span>
        ))}
      </div>
    </header>
  );
}

import { useActionPermissions } from "@/lib/permissions";
import { useEffect, type ComponentType } from "react";
import { Link, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  KeyRound,
  Palette,
  RadioTower,
  ScrollText,
  ServerCog,
  UserCog,
  UserRound,
} from "lucide-react";
import { WebApp } from "@versavolta/whisperink/components/WebApp/WebApp.js";
import type { NavGroup } from "@versavolta/whisperink/components/Sidebar/Sidebar.js";
import { UniverseSwitcher } from "@/components/universe-switcher";
import { UserMenu } from "@/components/user-menu";
import { UNIVERSE_NAV, navItemVisible, type UniverseNavItem } from "@/components/universe-nav";
import { useUserPreferences } from "@/lib/user-preferences";
import type { SessionUser } from "@/auth";
import { rememberUniverse, useUniverses } from "@/lib/universes";

type ShellMode = "universe" | "admin" | "account";

const ADMIN_NAV: Array<{ key: string; label: string; icon: ComponentType; href: string }> = [
  { key: "users", label: "Users", icon: UserCog, href: "/admin/users" },
  { key: "universes", label: "Universes", icon: Globe, href: "/admin/universes" },
  { key: "api-keys", label: "API keys", icon: KeyRound, href: "/admin/api-keys" },
  { key: "channels", label: "Channels", icon: RadioTower, href: "/admin/channels" },
  { key: "audit", label: "Audit log", icon: ScrollText, href: "/admin/audit" },
  { key: "environment-providers", label: "Environment providers", icon: ServerCog, href: "/admin/environment-providers" },
];

const ACCOUNT_NAV: Array<{ key: string; label: string; icon: ComponentType }> = [
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "security", label: "Security", icon: KeyRound },
  { key: "appearance", label: "Appearance", icon: Palette },
];

function initials(name: string): string {
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function navItems(items: readonly UniverseNavItem[], slug: string): NavGroup["items"] {
  return items.map((item) => {
    const Icon = item.icon;
    return {
      key: item.path,
      label: item.label,
      icon: <Icon />,
      href: `/u/${slug}/${item.path}`,
    };
  });
}

export function AppShell({ user, admin }: { user: SessionUser; admin: boolean }) {
  const universes = useUniverses();
  const navigate = useNavigate();
  const match = useMatch("/u/:slug/*");
  const activeSlug = match?.params.slug;
  const active = activeSlug
    ? universes.data?.find((universe) => universe.slug === activeSlug)
    : undefined;
  const permissions = useActionPermissions(active?.id);
  const location = useLocation();
  const mode: ShellMode = location.pathname.startsWith("/admin")
    ? "admin"
    : location.pathname.startsWith("/account")
      ? "account"
      : "universe";
  const { sidebarCollapsed, setSidebarCollapsed } = useUserPreferences();

  useEffect(() => {
    if (active) rememberUniverse(active.slug);
  }, [active]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b" || event.altKey || event.shiftKey || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setSidebarCollapsed(!sidebarCollapsed);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSidebarCollapsed, sidebarCollapsed]);

  const navigation: NavGroup[] = mode === "admin"
    ? [{
        key: "admin",
        label: "Platform admin",
        items: ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          return { key: item.key, label: item.label, icon: <Icon />, href: item.href };
        }),
      }]
    : mode === "account"
      ? [{
          key: "account",
          label: "Your account",
          items: ACCOUNT_NAV.map((item) => {
            const Icon = item.icon;
            return { key: item.key, label: item.label, icon: <Icon /> };
          }),
        }]
      : active
        ? UNIVERSE_NAV.flatMap((group, index) => {
            const items = group.items.filter((item) => navItemVisible(item, permissions.can, active.features));
            if (items.length === 0) return [];
            return [{
              key: group.label ?? `work-${index}`,
              label: group.label,
              items: navItems(items, active.slug),
            }];
          })
        : [];

  const hrefByKey = new Map(navigation.flatMap((group) => group.items.map((item) => [item.key, item.href])));
  const activeKey = mode === "admin"
    ? location.pathname.split("/")[2] ?? "users"
    : mode === "account"
      ? ""
      : [...hrefByKey.keys()].filter((key) => {
          const rest = activeSlug ? location.pathname.slice(`/u/${activeSlug}/`.length) : "";
          return rest === key || rest.startsWith(`${key}/`);
        }).sort((left, right) => right.length - left.length)[0] ?? "";

  const bleed = /\/u\/[^/]+\/(sessions|workspaces|profiles|bots)/.test(location.pathname);

  return (
    <WebApp
      className="h-full"
      mark={mode === "universe"
        ? <UniverseSwitcher active={active} admin={admin} />
        : (
          <Link to="/" className="focus-ring inline-flex items-center gap-2 rounded px-1 py-1 text-sm font-medium">
            <ArrowLeft className="size-4" />
            <span>{mode === "admin" ? "Platform admin" : "Your account"}</span>
          </Link>
        )}
      brand={mode === "universe" ? "Lightspeed" : null}
      navigation={navigation}
      active={activeKey}
      onNavigate={(key) => {
        if (mode === "account") {
          scrollToSection(key);
          return;
        }
        const href = hrefByKey.get(key);
        if (href) navigate(href);
      }}
      collapsed={sidebarCollapsed}
      onCollapsedChange={setSidebarCollapsed}
      search={false}
      showNotifications={false}
      user={{ name: user.name, initials: initials(user.name) }}
      userMenu={<UserMenu user={user} admin={admin} />}
      contentClassName={bleed ? "p-0" : "mx-auto w-full max-w-5xl"}
    >
      <div className={bleed ? "flex h-full min-h-0 flex-col" : undefined}>
        <Outlet />
      </div>
    </WebApp>
  );
}

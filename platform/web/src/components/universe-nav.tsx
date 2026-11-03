import type { ComponentType } from "react";
import {
  Brain,
  Broadcast,
  ChatsCircle,
  Cube,
  FolderOpen,
  Gear,
  HardDrives,
  Key,
  LockKey,
  Package,
  SlidersHorizontal,
  Users,
} from "@phosphor-icons/react";
import { Navigate } from "react-router-dom";
import type { FeatureKey, FeatureStates } from "@lightspeed-ai/platform-shared";
import { BotFaceIcon } from "@/components/icons/bot";
import { useActionPermissions, type PermissionAction } from "@/lib/permissions";
import { universeHome, useActiveUniverse } from "@/lib/universes";

/// One universe page in the sidebar. The item shows when the caller holds
/// `action` in the universe and its feature, if any, is on; the page applies
/// its own gate as well.
export interface UniverseNavItem {
  /// Relative to `/u/:slug/`.
  path: string;
  label: string;
  icon: ComponentType;
  action: PermissionAction;
  feature?: FeatureKey;
}

/// The bot mark is drawn on a 24px stroke grid; thinned to Phosphor's light
/// weight (12 on its 256 grid) so it matches the other sidebar icons.
function BotNavIcon() {
  return <BotFaceIcon strokeWidth={1.125} />;
}

export function navItemVisible(
  item: UniverseNavItem,
  can: (action: PermissionAction) => boolean,
  features: FeatureStates | undefined,
): boolean {
  return can(item.action) && (!item.feature || features?.[item.feature] !== false);
}

export interface UniverseNavGroup {
  label?: string;
  items: UniverseNavItem[];
}

/// The universe's own configuration, in the order `/settings` resolves.
const SETTINGS_NAV: UniverseNavItem[] = [
  { path: "settings/general", label: "General", icon: Gear, action: "manage_access" },
  { path: "settings/channels", label: "Channels", icon: Broadcast, action: "configure_resource", feature: "channels" },
  { path: "settings/templates", label: "Templates", icon: Package, action: "configure_resource" },
];

/// The work itself, the setup agents are made from, access (credentials,
/// keys and members), and the universe's settings. A group renders only when
/// one of its items is visible.
export const UNIVERSE_NAV: UniverseNavGroup[] = [
  {
    // Unlabelled: the universe switcher above already names the universe.
    items: [
      { path: "bots", label: "Bots", icon: BotNavIcon, action: "read", feature: "bots" },
      { path: "sessions", label: "Sessions", icon: ChatsCircle, action: "read" },
    ],
  },
  {
    // What a session's setup attaches; a profile is the saved recipe.
    label: "Setup",
    items: [
      { path: "profiles", label: "Profiles", icon: SlidersHorizontal, action: "read" },
      { path: "workspaces", label: "Workspaces", icon: FolderOpen, action: "read" },
      { path: "environments", label: "Environments", icon: Cube, action: "read" },
      { path: "mcp-servers", label: "MCP servers", icon: HardDrives, action: "read" },
      { path: "models", label: "Models", icon: Brain, action: "read" },
    ],
  },
  {
    label: "Access",
    items: [
      { path: "credentials", label: "Credentials", icon: LockKey, action: "configure_resource" },
      { path: "api-keys", label: "API keys", icon: Key, action: "manage_access" },
      { path: "members", label: "Members", icon: Users, action: "read" },
    ],
  },
  { label: "Settings", items: SETTINGS_NAV },
];

/// Bare `/settings`: the first settings page the caller may see, else the
/// universe's home.
export function settingsIndexPath(
  universe: { slug: string; features?: FeatureStates },
  can: (action: PermissionAction) => boolean,
): string {
  const first = SETTINGS_NAV.find((item) => navItemVisible(item, can, universe.features));
  return first ? `/u/${universe.slug}/${first.path}` : universeHome(universe);
}

export function SettingsIndexRedirect() {
  const { universe } = useActiveUniverse();
  const permissions = useActionPermissions(universe?.id);
  if (!universe || permissions.isLoading) {
    return null;
  }
  return <Navigate to={settingsIndexPath(universe, permissions.can)} replace />;
}

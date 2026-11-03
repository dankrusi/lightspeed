import type { ReactNode } from "react";
import { ChevronDown, Minimize2, Ellipsis, LoaderCircle, Share2, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "@versavolta/whisperink/components/Menu/Menu.js";
import { MenuItem } from "@versavolta/whisperink/components/Menu/MenuItem.js";
import { MenuSeparator } from "@versavolta/whisperink/components/Menu/MenuSeparator.js";
import { SessionMenuIdentity, SessionMenuMetadata } from "@/components/session/session-menu-details";
import { SessionMenuPreferences } from "@/components/session/session-menu-preferences";

/**
 * One menu for a session, on the Sessions page (behind ⋯) and on a bot's
 * conversation tab (behind its chevron): what can be done to the session
 * (settings, sharing, where else it opens), then view preferences and session
 * details. Within the action group, bot compaction follows reset and session
 * compaction precedes close/delete. Pages pass lifecycle items
 * (close and delete, or reset) and own every confirmation.
 */
export function SessionActionsMenu({
  sessionId,
  metadata,
  variant,
  open,
  onSettings,
  onShare,
  onCompact,
  compactionLabel,
  lifecycle,
}: {
  sessionId: string;
  metadata: Record<string, string> | undefined;
  variant: "more" | "tab";
  open?: { label: string; href: string; icon: ReactNode };
  onSettings?: () => void;
  /** Offered while the session is private and the viewer may share it. */
  onShare?: () => void;
  onCompact?: () => void;
  compactionLabel?: string | null;
  lifecycle?: ReactNode;
}) {
  const navigate = useNavigate();
  const compactItem = onCompact && (
    <MenuItem
      icon={compactionLabel ? <LoaderCircle className="animate-spin" /> : <Minimize2 />}
      onClick={onCompact}
      disabled={Boolean(compactionLabel)}
    >
      {compactionLabel ?? "Compact context"}
    </MenuItem>
  );
  return (
    <Menu
      align={variant === "more" ? "end" : "start"}
      className="max-h-[min(28rem,calc(100vh-1rem))] w-80 max-w-[calc(100vw-1rem)]"
      trigger={({ open: menuOpen, toggle }) =>
        variant === "more" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label="Session actions"
            title="Session actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={toggle}
          >
            <Ellipsis />
          </Button>
        ) : (
          <button
            type="button"
            aria-label="Conversation menu"
            title="Conversation menu"
            className="flex items-center rounded-sm pr-2 pl-0.5 text-muted-foreground hover:text-foreground"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={toggle}
          >
            <ChevronDown className="size-3.5" />
          </button>
        )
      }
    >
      {(onSettings || onShare || open || lifecycle || onCompact) && (
        <>
          {onSettings && (
            <MenuItem icon={<SlidersHorizontal />} onClick={onSettings}>
              Session settings
            </MenuItem>
          )}
          {onShare && (
            <MenuItem icon={<Share2 />} onClick={onShare}>
              Share with universe…
            </MenuItem>
          )}
          {open && (
            <MenuItem icon={open.icon} onClick={() => navigate(open.href)}>
              {open.label}
            </MenuItem>
          )}
          {variant === "tab" && lifecycle}
          {compactItem}
          {variant === "more" && lifecycle}
          <MenuSeparator />
        </>
      )}
      <SessionMenuPreferences />
      <MenuSeparator />
      <SessionMenuIdentity sessionId={sessionId} />
      <SessionMenuMetadata metadata={metadata} />
    </Menu>
  );
}

import { Ellipsis, LoaderCircle, Pause, Play, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu } from "@versavolta/whisperink/components/Menu/Menu.js";
import { MenuItem } from "@versavolta/whisperink/components/Menu/MenuItem.js";
import { MenuSeparator } from "@versavolta/whisperink/components/Menu/MenuSeparator.js";
import { MenuIdentity } from "@/components/session/session-menu-details";

/**
 * A bot's ⋯ menu, shaped like a session's: what can be done to the bot
 * (settings, pausing), then its id. Closing and deleting stay in settings,
 * beside what they end.
 */
export function BotActionsMenu({
  botId,
  onSettings,
  pause,
}: {
  botId: string;
  onSettings: () => void;
  /** Offered to managers of an open bot; `enabled` is whether it runs now. */
  pause?: { enabled: boolean; pending: boolean; onToggle: () => void };
}) {
  return (
    <Menu
      align="end"
      className="w-80 max-w-[calc(100vw-1rem)]"
      trigger={({ open, toggle }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label="Bot actions"
          title="Bot actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
        >
          {pause?.pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Ellipsis />}
        </Button>
      )}
    >
      <MenuItem icon={<SlidersHorizontal />} onClick={onSettings}>
        Bot settings
      </MenuItem>
      {pause && (
        <MenuItem
          icon={pause.enabled ? <Pause /> : <Play />}
          disabled={pause.pending}
          onClick={pause.onToggle}
          title={pause.enabled
            ? "Schedules stop and events wait; nothing is lost."
            : "Schedules and delivery resume."}
        >
          {pause.enabled ? "Pause bot" : "Resume bot"}
        </MenuItem>
      )}
      <MenuSeparator />
      <MenuIdentity noun="bot" id={botId} />
    </Menu>
  );
}

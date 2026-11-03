import { type DragEvent, useState } from "react";
import { cn } from "../../cn.js";
import { DotsSix, DotsSixVertical } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { TOOLBAR_TYPE } from "../Dock/drag.js";
import { Menu } from "../Menu/Menu.js";
import { MenuItem } from "../Menu/MenuItem.js";
import { ToolbarRovingContext } from "./toolbar-context.js";
import type { ToolbarDefinition, ToolbarEdge } from "./toolbar-types.js";
import { ToolButton } from "./ToolButton.js";

const GRIP = ":grip";

/**
 * One toolbar: a grip plus groups separated by rules. `edge` decides orientation.
 *
 * It is a single Tab stop with the arrow keys (and Home and End) moving between
 * its tools. Given `onMove`, the grip is also a menu naming the four edges, so
 * a toolbar can be put somewhere else without dragging — by keyboard, or on a
 * touch screen, where a native drag never starts.
 * @category workspace
 */
export function Toolbar({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  toolbar,
  edge,
  onDragStart,
  onDragEnd,
  onMove,
  defaultMenuOpen,
  className,
}: ({
  toolbar: ToolbarDefinition;
  edge: ToolbarEdge;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onMove?: (edge: ToolbarEdge) => void;
  /** Opens the grip's menu on mount, for documentation; see `Popover`. */
  defaultMenuOpen?: boolean;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("toolbar", "Group related tools", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const vertical = edge === "left" || edge === "right";
  const orientation = vertical ? "vertical" : "horizontal";
  const [focused, setFocused] = useState<string | null>(null);
  // Tab lands on the tool last focused while that tool can still take focus, and on the first one otherwise.
  const tools = toolbar.groups.flatMap((group) => group.items).filter((item) => !item.disabled).flatMap((item) => (item.menu ? [item.id, `${item.id}:menu`] : [item.id]));
  const current = focused !== null && (tools.includes(focused) || (focused === GRIP && onMove)) ? focused : tools[0] ?? (onMove ? GRIP : null);
  const drag = {
    draggable: Boolean(onDragStart),
    onDragStart: (event: DragEvent<HTMLElement>) => { event.dataTransfer.setData(TOOLBAR_TYPE, toolbar.id); event.dataTransfer.effectAllowed = "move"; onDragStart?.(toolbar.id); },
    onDragEnd,
    title: text.dock.moveToolbar,
  };
  const grip = cn("grid shrink-0 place-items-center text-fg-subtle hover:text-fg", onDragStart && "cursor-grab active:cursor-grabbing", vertical ? "h-4 w-8" : "h-8 w-4");
  const dots = vertical ? <DotsSix className="size-3.5" /> : <DotsSixVertical className="size-3.5" />;
  const edges: readonly [ToolbarEdge, string][] = [["top", text.dock.dockTop], ["left", text.dock.dockLeft], ["right", text.dock.dockRight], ["bottom", text.dock.dockBottom]];
  return (
    <ToolbarRovingContext.Provider value={{ current, setCurrent: setFocused }}>
      <div
        role="toolbar"
        aria-orientation={orientation}
        aria-label={toolbar.label ?? toolbar.id}
        onKeyDown={(event) => {
          // Only between the tools themselves; an open tool menu has arrow keys of its own.
          const from = event.target as HTMLElement;
          if (!from.hasAttribute("data-tool")) return;
          const stops = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-tool]:not(:disabled)")];
          const index = stops.indexOf(from);
          const next =
            event.key === (vertical ? "ArrowDown" : "ArrowRight") ? stops[(index + 1) % stops.length]
            : event.key === (vertical ? "ArrowUp" : "ArrowLeft") ? stops[(index - 1 + stops.length) % stops.length]
            : event.key === "Home" ? stops[0]
            : event.key === "End" ? stops[stops.length - 1]
            : undefined;
          if (!next) return;
          event.preventDefault();
          next.focus();
        }}
        className={cn(
          "flex items-center gap-1 rounded-[var(--card-radius)] border border-[rgb(var(--card-border-color))] bg-surface p-1 shadow-card",
          vertical && "flex-col",
          className,
        )} {..._ui.attributes}
      >
        {onMove ? (
          <Menu
            align="start"
            defaultOpen={defaultMenuOpen}
            trigger={({ toggle, open }) => (
              <button
                type="button"
                {...drag}
                data-tool={GRIP}
                tabIndex={current === GRIP ? 0 : -1}
                onFocus={() => setFocused(GRIP)}
                onClick={toggle}
                aria-label={text.dock.moveToolbar}
                aria-haspopup="menu"
                aria-expanded={open}
                className={cn("focus-ring rounded", grip)}
              >
                {dots}
              </button>
            )}
          >
            {edges.map(([target, label]) => <MenuItem key={target} checked={target === edge} onClick={() => onMove(target)}>{label}</MenuItem>)}
          </Menu>
        ) : (
          <span {...drag} className={grip}>{dots}</span>
        )}
        {toolbar.groups.map((group, index) => (
          <div key={group.id} className={cn("flex items-center gap-0.5", vertical && "flex-col")}>
            {index > 0 && <span className={cn("bg-border", vertical ? "my-1 h-px w-6" : "mx-1 h-6 w-px")} aria-hidden="true" />}
            {group.items.map((item) => <ToolButton key={item.id} item={item} orientation={orientation} />)}
          </div>
        ))}
      </div>
    </ToolbarRovingContext.Provider>
  );
}

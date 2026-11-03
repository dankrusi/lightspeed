import type { DragEvent, ReactNode } from "react";
import { cn } from "../../cn.js";
import { DotsSixVertical, DotsThree, Question, X } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";
import { Menu } from "../Menu/Menu.js";
import { MenuItem } from "../Menu/MenuItem.js";
import { MenuSeparator } from "../Menu/MenuSeparator.js";
import type { DockSide } from "./dock-layout.js";

/**
 * Title bar of a workspace panel: a menu to move it to another dock side,
 * close and help buttons when handlers are given, and dragging to re-dock it.
 * @category workspace
 */
export function PanelHeader({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  title,
  icon,
  onClose,
  onMove,
  side,
  onHelp,
  helpActive,
  draggable,
  onDragStart,
  onDragEnd,
  extra,
  defaultMenuOpen,
}: ({
  title: string;
  icon?: ReactNode;
  onClose?: () => void;
  onMove?: (side: DockSide) => void;
  /** Where the panel is docked now, so its menu can mark that side. */
  side?: DockSide;
  onHelp?: () => void;
  helpActive?: boolean;
  draggable?: boolean;
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: () => void;
  extra?: ReactNode;
  /** Opens the menu on mount, for documentation; see `Popover`. */
  defaultMenuOpen?: boolean;
}) & UiMetadataProps) {
  const _ui = uiMetadata("panel-header", "Identify a workspace panel", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  return (
    <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border px-1.5" {..._ui.attributes}>
      <span
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title={draggable ? text.dock.movePanel : undefined}
        className={cn("grid h-7 w-5 place-items-center text-fg-subtle", draggable && "cursor-grab hover:text-fg active:cursor-grabbing")}
      >
        <DotsSixVertical className="size-3.5" />
      </span>
      {icon && <span className="grid size-5 place-items-center text-fg-muted [&_svg]:size-4">{icon}</span>}
      <span className="flex-1 truncate text-sm font-semibold">{title}</span>
      {extra}
      {onMove && (
        <Menu defaultOpen={defaultMenuOpen} trigger={({ toggle, open }) => <IconButton label={text.dock.panelOptions} size="sm" onClick={toggle} aria-haspopup="menu" aria-expanded={open} className="size-7"><DotsThree /></IconButton>}>
          {([["left", text.dock.dockLeft], ["right", text.dock.dockRight], ["bottom", text.dock.dockBottom]] as const).map(([target, label]) => (
            <MenuItem key={target} checked={side === undefined ? undefined : side === target} onClick={() => onMove(target)}>{label}</MenuItem>
          ))}
          {onClose && <MenuSeparator />}
          {onClose && <MenuItem onClick={onClose}>{text.dock.close}</MenuItem>}
        </Menu>
      )}
      {onHelp && (
        <IconButton
          label={text.dock.help}
          size="sm"
          onClick={onHelp}
          aria-pressed={helpActive}
          className={cn("size-7", helpActive && "bg-primary text-primary-fg")}
        >
          <Question />
        </IconButton>
      )}
      {onClose && <IconButton label={text.dock.close} size="sm" onClick={onClose} className="size-7"><X /></IconButton>}
    </div>
  );
}

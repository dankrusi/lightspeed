import { useContext } from "react";
import { cn } from "../../cn.js";
import { CaretDown } from "../../icons.js";
import { useText } from "../../text.js";
import { itemMetadata, uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Menu } from "../Menu/Menu.js";
import { MenuItem } from "../Menu/MenuItem.js";
import { Tooltip } from "../Tooltip/Tooltip.js";
import { ToolbarRovingContext } from "./toolbar-context.js";
import type { ToolItem } from "./toolbar-types.js";

/**
 * One tool in a `Toolbar`: an icon button with a tooltip and a pressed state,
 * optionally labelled, split or opening a menu.
 * @category workspace
 */
export function ToolButton({ uiId, uiDescription, uiComponentId, uiComponentDescription, item, orientation, size = "md", defaultMenuOpen }: ({
  item: ToolItem;
  orientation: "horizontal" | "vertical";
  size?: "sm" | "md";
  /** Opens the menu of a split or menu tool on mount, for documentation; see `Popover`. */
  defaultMenuOpen?: boolean;
}) & UiMetadataProps) {
  // Props given to the button win over the ones its item carries.
  const _ui = uiMetadata("tool-button", "Activate a workspace tool", {
    uiId: uiId ?? item.uiId,
    uiDescription: uiDescription ?? item.uiDescription,
    uiComponentId: uiComponentId ?? item.uiComponentId,
    uiComponentDescription: uiComponentDescription ?? item.uiComponentDescription,
  });
  const text = useText();
  const roving = useContext(ToolbarRovingContext);
  const stop = (id: string) => ({
    "data-tool": id,
    tabIndex: roving ? (roving.current === id ? 0 : -1) : undefined,
    onFocus: () => roving?.setCurrent(id),
  });
  const label = item.showLabel && orientation === "horizontal";
  // Both halves of a split tool are the same button in everything but which
  // corners they round, so what they look like is described once.
  const face = cn(
    "focus-ring inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-40 [&_svg]:size-4",
    size === "sm" ? "h-7" : "h-8",
    item.active ? "bg-primary text-primary-fg" : "text-fg-muted hover:bg-subtle hover:text-fg",
  );
  const button = (
    <button
      type="button"
      // Without the visible label the tooltip is only a description, so the
      // button still needs its own accessible name.
      aria-label={label ? undefined : item.label}
      aria-pressed={item.active}
      disabled={item.disabled}
      onClick={item.onClick}
      {...stop(item.id)}
      className={cn(
        face,
        size === "sm" ? "min-w-7" : "min-w-8",
        label ? "px-2.5" : "px-0",
        item.menu ? "rounded-l-[var(--button-radius)]" : "rounded-[var(--button-radius)]",
      )} {..._ui.attributes}
    >
      {item.icon}
      {label && <span className="max-w-40 truncate">{item.label}</span>}
    </button>
  );
  // Beside a vertical bar, where it does not lie over the next tool down.
  const described = label ? button : <Tooltip content={item.label} side={orientation === "vertical" ? "right" : "bottom"} {..._ui.props}>{button}</Tooltip>;
  if (!item.menu) return described;
  return (
    // One control with two places to press: the rule down the middle is the
    // only seam, so the caret reads as part of the button rather than beside it.
    <span className="inline-flex shrink-0 items-center" {..._ui.attributes}>
      {described}
      <Menu
        align="start"
        defaultOpen={defaultMenuOpen}
        // What is listed here is named by the document, and those names are
        // longer than a toolbar button is wide. The panel takes the width of
        // the longest of them, within a floor that keeps a short list from
        // looking pinched and a ceiling that keeps a long one from crossing
        // the window; past that a name is clipped rather than the menu grown.
        className="w-max min-w-80 max-w-[min(30rem,80vw)]"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-label={item.menuLabel ?? text.dock.toolOptions}
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={item.disabled}
            onClick={toggle}
            {...stop(`${item.id}:menu`)}
            className={cn(
              face,
              "w-5 rounded-r-[var(--button-radius)] border-l px-0",
              item.active ? "border-primary-fg/25" : "border-border",
            )}
          >
            <CaretDown className="size-3" />
          </button>
        )}
      >
        {/* A project can hold fifty of these, so the list scrolls rather than
            growing past the window. */}
        <div className="grid max-h-[min(24rem,50vh)] overflow-y-auto">
          {item.menu.map((entry) => (
            <MenuItem
              key={entry.id}
              {...itemMetadata(entry)}
              disabled={entry.disabled}
              onClick={entry.onClick}
              checked={Boolean(entry.active)}
              icon={entry.icon}
            >
              {entry.label}
            </MenuItem>
          ))}
        </div>
      </Menu>
    </span>
  );
}

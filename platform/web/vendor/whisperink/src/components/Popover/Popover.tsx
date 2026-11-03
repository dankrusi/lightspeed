import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { FOCUSABLE, useFloating, useKeyLayer } from "../../floating.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { PopoverOpenedContext } from "./popover-context.js";

/**
 * Generic anchored popover; the trigger receives `open` and a toggle handler.
 *
 * The panel is placed against the trigger above everything else on the page:
 * it flips to the other side when there is no room, stays inside the viewport,
 * and scrolls rather than running off it. Escape, a press outside and focus
 * leaving all dismiss it, and whenever focus was inside it goes back to the
 * trigger instead of being dropped on the page.
 * @category overlays
 */
export function Popover({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  trigger,
  align = "start",
  side = "bottom",
  rootClassName,
  className,
  children,
  defaultOpen = false,
}: ({
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  align?: "start" | "end";
  /** Preferred side; the other one is used when this one has no room. */
  side?: "bottom" | "top";
  /** Sizing for the trigger and its anchored panel as one unit. */
  rootClassName?: string;
  className?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
  /**
   * Mounts it open, for documentation. It is placed like any open popover (inside
   * an `OverlayRegion`, within the region) but stays open, without taking focus,
   * until someone uses it.
   */
  defaultOpen?: boolean;
}) & UiMetadataProps) {
  const _ui = uiMetadata("popover", "Show anchored content", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const [open, setOpen] = useState(defaultOpen);
  const [opened, setOpened] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  /** What had focus when the popover opened, which is where focus returns. */
  const opener = useRef<HTMLElement | null>(null);
  // One that documentation mounts open is on display: placed like any other,
  // but it stays open until it is used rather than closing on the first press
  // anywhere, and takes no focus. Once someone opens it themselves it is live.
  const live = open && opened;
  useFloating(open, root, panel, side, align);

  const restoreFocus = useCallback(() => {
    const target = opener.current?.isConnected
      ? opener.current
      : [...(root.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].find((element) => !panel.current?.contains(element));
    target?.focus();
  }, []);
  const close = useCallback(() => {
    // Whatever in the panel has focus is about to go, so hand focus back first.
    if (panel.current?.contains(document.activeElement)) restoreFocus();
    setOpen(false);
  }, [restoreFocus]);
  const toggle = () => {
    if (open) return close();
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && root.current?.contains(active) ? active : null;
    setOpened(true);
    setOpen(true);
  };

  useEffect(() => {
    if (!live) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [live]);
  useKeyLayer(live, (event) => {
    if (event.key !== "Escape") return false;
    restoreFocus();
    setOpen(false);
    return true;
  });

  return (
    <div
      ref={root}
      className={cn("relative inline-flex", rootClassName)}
      onBlur={(event) => {
        // Switching to another window is not leaving the popover.
        if (!live || !document.hasFocus()) return;
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }} {..._ui.attributes}
    >
      {trigger({ open, toggle })}
      {open && (
        <div
          ref={panel}
          popover="manual"
          // Focusable, so a press on its own padding lands here instead of
          // taking focus out of the popover and dismissing it.
          tabIndex={-1}
          className={cn(
            "scrollbar-thin min-w-56 animate-scale-in overflow-y-auto rounded-[var(--menu-radius)] border-[length:var(--menu-border-width)] border-[rgb(var(--menu-border-color))] bg-surface p-1 text-fg shadow-menu outline-none",
            "wi-floating z-[70]",
            className,
          )}
        >
          <PopoverOpenedContext.Provider value={opened}>
            {typeof children === "function" ? children(close) : children}
          </PopoverOpenedContext.Provider>
        </div>
      )}
    </div>
  );
}

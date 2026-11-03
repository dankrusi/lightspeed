import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../cn.js";
import { FOCUSABLE, lockScroll, useKeyLayer, useOnDisplay, useOverlayRegion } from "../../floating.js";
import { X } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";

const FIELD = "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])";

/**
 * Dialog with a focus trap, focus restore and a still page behind it.
 *
 * On opening, focus goes to the element marked `data-autofocus`, else to the
 * first field in the body, else to the first button of the footer — the
 * cautious choice in a confirmation — and only then to the close button.
 * Escape belongs to whatever is open on top: a menu or a second dialog inside
 * this one closes first, and this one stays.
 *
 * Inside an `OverlayRegion` it covers the region only and the page keeps
 * scrolling. One that is open when it mounts there is on display: it takes
 * focus and traps Tab only once a press or focus goes into it.
 * @category overlays
 */
export function Modal({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  inline = false,
  backdrop = "dim",
  movable = false,
  dismissible = true,
}: ({
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Renders inside the parent instead of the document body, without focus
   * handling. Prefer an `OverlayRegion`, which keeps the dialog's real behaviour.
   */
  inline?: boolean;
  /**
   * "dim" veils what is behind. "clear" leaves it plainly visible,
   * for a dialog whose whole point is watching what it changes; a click outside
   * then does not dismiss, since a backdrop nobody can see is not one anybody
   * meant to aim at.
   */
  backdrop?: "dim" | "clear";
  /** Let the dialog be dragged by its header, out of the way of what it changes. */
  movable?: boolean;
  /** Disable dismissal while an operation must finish before interaction resumes. */
  dismissible?: boolean;
}) & UiMetadataProps) {
  const _ui = uiMetadata("modal", "Show a focused dialog", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  /** The area the dialog may be moved around in. */
  const room = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ pointer: number; x: number; y: number; from: { x: number; y: number } } | null>(null);
  // Each opening starts centred: where it was last put may be nowhere now.
  useEffect(() => { if (open) setMoved(null); }, [open]);
  // Held in refs so the effect below depends only on whether the modal is open.
  // A caller writing onClose inline gives it a new identity on every render, and
  // `dismissible` turns off the moment an operation starts; an effect that
  // re-ran on either would pull focus back to the first field mid-typing.
  const close = useRef(onClose);
  close.current = onClose;
  const canDismiss = useRef(dismissible);
  canDismiss.current = dismissible;
  // Roving widgets park most of their parts at tabindex -1; Tab never stops on those.
  const focusables = () => [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((element) => element.tabIndex !== -1);
  const region = useOverlayRegion();
  const [onDisplay, use] = useOnDisplay(open);
  /** Set when someone went into a dialog on display: focus is already where they put it. */
  const enteredByHand = useRef(false);
  const live = open && !inline && !onDisplay;
  const takeOver = () => { if (onDisplay) { enteredByHand.current = true; use(); } };
  useKeyLayer(live, (event) => {
    if (event.key === "Escape") { if (canDismiss.current) close.current(); return true; }
    if (event.key !== "Tab") return false;
    const items = focusables();
    const active = document.activeElement;
    const inside = Boolean(panel.current?.contains(active));
    if (!items.length) { event.preventDefault(); panel.current?.focus(); }
    else if (event.shiftKey && (active === items[0] || !inside)) { event.preventDefault(); items[items.length - 1].focus(); }
    else if (!event.shiftKey && (active === items[items.length - 1] || !inside)) { event.preventDefault(); items[0].focus(); }
    return true;
  });
  useEffect(() => {
    if (!live) return;
    const byHand = enteredByHand.current;
    enteredByHand.current = false;
    const restoreTo = byHand ? null : (document.activeElement as HTMLElement | null);
    // A region is a part of the page; the rest of it stays usable and scrollable.
    const unlock = region ? () => undefined : lockScroll();
    const initial =
      panel.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      body.current?.querySelector<HTMLElement>(FIELD) ??
      foot.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      focusables()[0] ??
      panel.current;
    if (!byHand) initial?.focus();
    return () => {
      unlock();
      restoreTo?.focus?.();
    };
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-5xl" }[size];

  const moveTo = (x: number, y: number) => {
    const box = panel.current?.getBoundingClientRect();
    const within = room.current?.getBoundingClientRect();
    if (!box || !within) return { x, y };
    // The rectangle already carries the current offset, so take it back out to
    // find where the dialog sits when it has not been moved at all.
    const left = box.left - (moved?.x ?? 0);
    const top = box.top - (moved?.y ?? 0);
    // Moving it aside is the point; moving it off the edge is not. Leaving only
    // a sliver behind would leave nothing but the close button to grab, since
    // that is the one part of the header a drag may not start on.
    return {
      x: Math.min(within.right - box.width - left, Math.max(within.left - left, x)),
      y: Math.min(within.bottom - box.height - top, Math.max(within.top - top, y)),
    };
  };
  const startMove = (event: ReactPointerEvent<HTMLElement>) => {
    // Never from the close button, and never from a secondary click.
    if (!movable || event.button !== 0 || (event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, from: moved ?? { x: 0, y: 0 } };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const keepMoving = (event: ReactPointerEvent<HTMLElement>) => {
    const held = drag.current;
    if (!held || held.pointer !== event.pointerId) return;
    setMoved(moveTo(held.from.x + event.clientX - held.x, held.from.y + event.clientY - held.y));
  };
  const stopMoving = (event: ReactPointerEvent<HTMLElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const content = (
    <div
      ref={room}
      className={cn("z-50 flex items-center justify-center p-4", backdrop === "dim" && "bg-overlay/40", inline ? "absolute inset-0" : "fixed inset-0")}
      onMouseDown={(event) => dismissible && backdrop === "dim" && event.target === event.currentTarget && onClose()}
      onPointerDownCapture={takeOver}
      onFocusCapture={takeOver} {..._ui.attributes}
    >
      <div
        ref={panel}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        // `translate` rather than a transform, so being moved does not fight the
        // scaling the dialog opens with.
        style={moved ? { translate: `${moved.x}px ${moved.y}px` } : undefined}
        className={cn("focus-ring flex max-h-full w-full animate-scale-in flex-col overflow-hidden rounded-[var(--modal-radius)] border-[length:var(--modal-border-width)] border-[rgb(var(--modal-border-color))] bg-surface shadow-modal", width)}
      >
        <div
          onPointerDown={startMove}
          onPointerMove={keepMoving}
          onPointerUp={stopMoving}
          onPointerCancel={stopMoving}
          className={cn("flex items-start justify-between gap-4 px-6 pb-4 pt-5", movable && "cursor-grab touch-none select-none active:cursor-grabbing")}
        >
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
          {dismissible && <IconButton label={text.actions.close} size="sm" onClick={onClose} className="-mr-2 -mt-1"><X /></IconButton>}
        </div>
        <div ref={body} className="scrollbar-thin min-h-0 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div ref={foot} className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-subtle/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
  if (inline) return content;
  // Inside a region it waits for the region's element rather than flashing over the whole page.
  if (region) return region.element ? createPortal(content, region.element) : null;
  // Server rendering has no document to portal into; the dialog appears once the page hydrates.
  return typeof document === "undefined" ? null : createPortal(content, document.body);
}

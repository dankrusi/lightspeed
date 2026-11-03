import { createContext, type FocusEvent, type PointerEvent, type ReactNode, type RefObject, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

/*
 * What menus, popovers, tooltips and dialogs share: being placed against an
 * anchor without being clipped, agreeing on which open layer a key belongs to,
 * and keeping the page still behind a dialog. Internal to the kit — the
 * components built on it are the API.
 */

export type FloatingSide = "top" | "bottom" | "left" | "right";
export type FloatingAlign = "start" | "center" | "end";

/** Distance kept from the edge of the window or region. */
const MARGIN = 8;
const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;
const topLayer = typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;

/* ------------------------------------------------------------------ regions */

/**
 * The region overlays are confined to (see `OverlayRegion`), or null for the
 * window. `element` is null for the moment between the region rendering and
 * its element existing; overlays wait for it rather than flashing in the window.
 */
export type OverlayRegionValue = { element: HTMLElement | null };
export const OverlayRegionContext = createContext<OverlayRegionValue | null>(null);

export function useOverlayRegion(): OverlayRegionValue | null {
  return useContext(OverlayRegionContext);
}

/**
 * An overlay open when it mounts inside a region is on display: it takes no
 * focus, traps no keys and ignores presses elsewhere until someone uses it.
 * `use` marks that moment; one opened later is in use from the start.
 */
export function useOnDisplay(open: boolean): [boolean, () => void] {
  const region = useOverlayRegion();
  const [onDisplay, setOnDisplay] = useState(() => Boolean(region && open));
  useEffect(() => { if (!open) setOnDisplay(false); }, [open]);
  return [onDisplay && open, () => setOnDisplay(false)];
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Every ancestor that can scroll or clip the anchor out of sight. */
function clippingAncestors(element: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (let node = element.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node);
    if (overflowX !== "visible" || overflowY !== "visible") result.push(node);
  }
  return result;
}

/**
 * Places `floating` against `anchor` inside `region`, or inside the window
 * when there is none. Everything is worked out in window pixels and written
 * back in the region's own pixels: a region scaled with a transform (a
 * thumbnail) has its fixed-position children laid out before the scaling.
 */
function place(anchor: HTMLElement, floating: HTMLElement, clips: readonly HTMLElement[], side: FloatingSide, align: FloatingAlign, gap: number, region: HTMLElement | null) {
  const rect = anchor.getBoundingClientRect();
  let bounds = { left: 0, top: 0, right: document.documentElement.clientWidth, bottom: document.documentElement.clientHeight };
  let origin = { x: 0, y: 0 };
  let scale = 1;
  if (region) {
    const box = region.getBoundingClientRect();
    scale = region.offsetWidth ? box.width / region.offsetWidth : 1;
    bounds = { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    origin = { x: box.left + region.clientLeft * scale, y: box.top + region.clientTop * scale };
  }
  const style = floating.style;
  // Measured from the corner, where nothing but the bounds limit its width.
  style.left = "0px";
  style.top = "0px";
  style.maxWidth = region ? `${Math.max(0, (bounds.right - bounds.left) / scale - 2 * MARGIN)}px` : "";
  const space = {
    top: rect.top - bounds.top - gap - MARGIN,
    bottom: bounds.bottom - rect.bottom - gap - MARGIN,
    left: rect.left - bounds.left - gap - MARGIN,
    right: bounds.right - rect.right - gap - MARGIN,
  };
  const vertical = side === "top" || side === "bottom";
  const width = floating.offsetWidth * scale;
  // The height it would have without the cap below. Read rather than measured
  // by lifting the cap, which would throw a scrolled list back to its top.
  const natural = (floating.scrollHeight + floating.offsetHeight - floating.clientHeight) * scale;
  // The preferred side holds unless the other one is both needed and roomier.
  const resolved = (vertical ? natural : width) > space[side] && space[opposite[side]] > space[side] ? opposite[side] : side;
  const limit = Math.max(vertical ? space[resolved] : bounds.bottom - bounds.top - 2 * MARGIN, 96 * scale);
  style.maxHeight = natural > limit ? `${limit / scale}px` : "";
  const height = floating.offsetHeight * scale;

  let left: number;
  let top: number;
  if (vertical) {
    top = resolved === "bottom" ? rect.bottom + gap : rect.top - gap - height;
    left = align === "start" ? rect.left : align === "end" ? rect.right - width : rect.left + (rect.width - width) / 2;
  } else {
    left = resolved === "right" ? rect.right + gap : rect.left - gap - width;
    top = align === "start" ? rect.top : align === "end" ? rect.bottom - height : rect.top + (rect.height - height) / 2;
  }
  left = clamp(left, bounds.left + MARGIN, bounds.right - MARGIN - width);
  top = clamp(top, bounds.top + MARGIN, bounds.bottom - MARGIN - height);
  style.left = `${Math.round((left - origin.x) / scale)}px`;
  style.top = `${Math.round((top - origin.y) / scale)}px`;
  // It grows out of the edge it hangs from.
  const along = align === "center" ? "center" : vertical ? (align === "start" ? "left" : "right") : align === "start" ? "top" : "bottom";
  style.transformOrigin = vertical ? `${along} ${opposite[resolved]}` : `${opposite[resolved]} ${along}`;

  // An anchor scrolled out of sight takes its layer with it, rather than
  // leaving a menu pinned to the edge of the window over unrelated content.
  const outside = (box: { top: number; bottom: number; left: number; right: number }) => rect.bottom <= box.top || rect.top >= box.bottom || rect.right <= box.left || rect.left >= box.right;
  const gone = outside(bounds) || clips.some((clip) => outside(clip.getBoundingClientRect()));
  style.visibility = gone ? "hidden" : "";
}

/**
 * Keeps `floating` placed against `anchor` while `open`: on the preferred
 * side when it fits, flipped when it does not, always inside the window (or
 * the `OverlayRegion` it sits in) and no taller than the room it has. Follows
 * scrolling, resizing and its own content changing size.
 */
export function useFloating(
  open: boolean,
  anchor: RefObject<HTMLElement | null>,
  floating: RefObject<HTMLElement | null>,
  side: FloatingSide,
  align: FloatingAlign,
  gap = 6,
) {
  const region = useOverlayRegion();
  const inRegion = region !== null;
  const regionElement = region?.element ?? null;
  useLayoutEffect(() => {
    const target = anchor.current;
    const layer = floating.current;
    if (!open || !target || !layer) return;
    // Inside a region the region is the layer: lifting it into the top layer would escape it.
    if (inRegion && !regionElement) return;
    const lifted = topLayer && !inRegion;
    if (lifted) {
      try { layer.showPopover(); } catch { /* already showing */ }
    }
    const clips = clippingAncestors(target);
    const update = () => place(target, layer, clips, side, align, gap, regionElement);
    update();
    // Its own list scrolling is not the anchor moving.
    const onScroll = (event: Event) => { if (!(event.target instanceof Node && layer.contains(event.target))) update(); };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(target);
    observer?.observe(layer);
    if (regionElement) observer?.observe(regionElement);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll, { capture: true });
      observer?.disconnect();
      if (lifted) {
        try { layer.hidePopover(); } catch { /* already gone */ }
      }
    };
  }, [open, anchor, floating, side, align, gap, inRegion, regionElement]);
}

/* ------------------------------------------------------------------ key layers */

type KeyLayer = (event: KeyboardEvent) => boolean;
const keyLayers: { current: KeyLayer }[] = [];

function dispatchKey(event: KeyboardEvent) {
  for (let index = keyLayers.length - 1; index >= 0; index -= 1) {
    if (keyLayers[index]!.current(event)) return;
  }
}

/**
 * Offers document-level keys to the open layers from the top down, stopping
 * at the first that takes one (returns true). This is what lets Escape close
 * a menu without also closing the dialog the menu sits in, and keeps a dialog
 * underneath from trapping Tab while another is open above it.
 */
export function useKeyLayer(active: boolean, handler: KeyLayer) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!active) return;
    keyLayers.push(latest);
    if (keyLayers.length === 1) document.addEventListener("keydown", dispatchKey);
    return () => {
      keyLayers.splice(keyLayers.indexOf(latest), 1);
      if (keyLayers.length === 0) document.removeEventListener("keydown", dispatchKey);
    };
  }, [active]);
}

/* ------------------------------------------------------------------ scroll lock */

let scrollLocks = 0;
let unlockScroll: (() => void) | null = null;

/**
 * Stops the page scrolling behind a dialog. Counted, so a dialog opened from
 * a dialog does not release the page when only the inner one closes, and the
 * width of the scrollbar that disappears is padded back so nothing jumps.
 */
export function lockScroll(): () => void {
  if (scrollLocks === 0) {
    const { style } = document.body;
    const previous = { overflow: style.overflow, paddingRight: style.paddingRight };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) style.paddingRight = `${(Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0) + scrollbar}px`;
    style.overflow = "hidden";
    unlockScroll = () => { style.overflow = previous.overflow; style.paddingRight = previous.paddingRight; };
  }
  scrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    scrollLocks -= 1;
    if (scrollLocks === 0) { unlockScroll?.(); unlockScroll = null; }
  };
}

/* ------------------------------------------------------------------ tooltip */

/** How long the pointer rests before a tooltip shows. */
const SHOW_DELAY = 350;
/** Moving on to a neighbour this soon after one closed shows the next at once. */
const WARM = 400;
let lastClosed = 0;

function focusVisible(element: Element): boolean {
  try { return element.matches(":focus-visible"); } catch { return true; }
}

/** Runs the caller's own handler, then the kit's. */
export function chain<E>(own: ((event: E) => void) | undefined, next: (event: E) => void): (event: E) => void {
  return (event) => { own?.(event); next(event); };
}

/**
 * Tooltip behaviour for one trigger: shows after a short rest of the pointer
 * (at once when another tooltip was just open) or on keyboard focus, hides on
 * leave, blur, Escape and a press. `pin` turns the press into "show and keep",
 * for a trigger whose only job is to explain something.
 *
 * Returns the handlers for the trigger and the bubble to render inside it.
 */
export function useTooltip(content: ReactNode, { side = "top", pin = false, defaultOpen = false }: { side?: FloatingSide; pin?: boolean; defaultOpen?: boolean } = {}) {
  const [open, setOpen] = useState(defaultOpen);
  const anchor = useRef<HTMLElement | null>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);
  const pinned = useRef(false);
  // One mounted open is on display until its trigger is used; until then nothing else dismisses it.
  const [displayed, setDisplayed] = useState(defaultOpen);
  useFloating(open, anchor, bubble, side, "center");

  const show = (element: HTMLElement, rest: boolean) => {
    setDisplayed(false);
    anchor.current = element;
    window.clearTimeout(timer.current);
    if (!rest || Date.now() - lastClosed < WARM) setOpen(true);
    else timer.current = window.setTimeout(() => setOpen(true), SHOW_DELAY);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    pinned.current = false;
    setDisplayed(false);
    setOpen(false);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open || displayed) return;
    // Capturing, so a control that keeps Escape to itself still lets the tooltip go.
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    const onPointer = (event: Event) => { if (!anchor.current?.contains(event.target as Node)) hide(); };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
      lastClosed = Date.now();
    };
  }, [open, displayed]);

  return {
    trigger: {
      // The trigger is the anchor from the start, so a tooltip mounted open has something to hang from.
      ref: (element: HTMLElement | null) => { if (element && !anchor.current) anchor.current = element; },
      onPointerEnter: (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== "touch") show(event.currentTarget, true); },
      onPointerLeave: () => { if (!pinned.current) hide(); },
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (!pin) return hide();
        pinned.current = true;
        show(event.currentTarget, false);
      },
      // Only for someone moving by keyboard; a click focuses too, and has the pointer to go by.
      onFocus: (event: FocusEvent<HTMLElement>) => { if (focusVisible(event.target)) show(event.currentTarget, false); },
      onBlur: hide,
    },
    bubble: open && content ? (
      <span
        ref={bubble}
        popover="manual"
        aria-hidden="true"
        className="wi-floating pointer-events-none z-[70] w-max max-w-64 animate-fade-in select-none whitespace-normal rounded-[var(--tooltip-radius)] bg-fg px-2.5 py-1.5 text-left font-sans text-xs font-medium normal-case leading-snug tracking-normal text-fg-inverse shadow-tooltip"
      >
        {content}
      </span>
    ) : null,
  };
}

/** Selector for focusable elements, shared by popovers and dialogs. */
export const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

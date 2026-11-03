import { cloneElement, isValidElement, type ReactElement, type ReactNode, useId } from "react";
import { type FloatingSide, useTooltip } from "../../floating.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Tooltip for whatever it wraps. It shows after the pointer rests or on
 * keyboard focus, goes on Escape, and is drawn above everything else, so a
 * scrolling table or a dialog cannot cut it off; near an edge it moves to the
 * side that has room.
 *
 * `pinOnClick` is for a trigger that exists only to explain something, such as
 * a help button: pressing it shows the text and keeps it until the next press
 * elsewhere, which is what makes it reachable by touch.
 * @category overlays
 */
export function Tooltip({ uiId, uiDescription, uiComponentId, uiComponentDescription, content, side = "top", pinOnClick = false, defaultOpen = false, children }: ({
  content: ReactNode;
  side?: FloatingSide;
  pinOnClick?: boolean;
  /** Shows it from the start, for documentation; it then stays until its trigger is used. Inside an `OverlayRegion` it stays within the region. */
  defaultOpen?: boolean;
  children: ReactNode;
}) & UiMetadataProps) {
  const _ui = uiMetadata("tooltip", "Explain a control", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const id = useId();
  const tip = useTooltip(content, { side, pin: pinOnClick, defaultOpen });
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, { "aria-describedby": [(children as ReactElement<{ "aria-describedby"?: string }>).props["aria-describedby"], id].filter(Boolean).join(" ") })
    : children;
  return (
    <span className="relative inline-flex" {...tip.trigger} {..._ui.attributes}>
      {trigger}
      {/* What assistive technology reads: always there, whether or not the bubble is showing. */}
      <span id={id} role="tooltip" hidden>{content}</span>
      {tip.bubble}
    </span>
  );
}

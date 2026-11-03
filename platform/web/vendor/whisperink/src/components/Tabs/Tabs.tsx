import { useEffect, useId, useRef } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { roving, type TabItem } from "./roving.js";

/**
 * Underline tabs for switching page sections; proper tablist semantics and
 * arrow-key navigation. More tabs than fit scroll sideways inside the bar
 * instead of pushing the page wide, and the selected one is kept in view.
 * @category navigation
 */
export function Tabs({ uiId, uiDescription, uiComponentId, uiComponentDescription, items, value, onChange, className, id: explicitId, label }: ({ items: readonly TabItem[]; value: string; onChange: (value: string) => void; className?: string; /** Stable id to link `TabPanel`s. */ id?: string; label?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("tabs", "Switch between views", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  const list = useRef<HTMLDivElement>(null);
  // Only the bar itself is scrolled: `scrollIntoView` would move the page too.
  useEffect(() => {
    const bar = list.current;
    const tab = bar?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!bar || !tab) return;
    if (tab.offsetLeft < bar.scrollLeft) bar.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = tab.offsetLeft + tab.offsetWidth - bar.clientWidth;
  }, [value]);
  return (
    <div
      ref={list}
      role="tablist"
      aria-orientation="horizontal"
      aria-label={label}
      // The rule is an inset shadow rather than a border, so the indicator of
      // the selected tab can sit on it without the bar having to overflow.
      className={cn("scrollbar-none relative flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--border))]", className)}
      onKeyDown={(event) => roving(event, items, value, onChange)} {..._ui.attributes}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-${item.value}`}
            aria-controls={`${id}-${item.value}-panel`}
            data-value={item.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            {...uiMetadata("tab", "Show one view", item).attributes}
            className={cn(
              // The ring is drawn inside the tab: the bar clips anything outside it.
              "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-t-sm border-b-[length:var(--tab-indicator-width)] px-3 text-base font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--ring))] disabled:opacity-40 [&_svg]:size-4",
              selected ? "border-primary text-fg" : "border-transparent text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-2xs font-semibold tabular-nums", selected ? "bg-primary text-primary-fg" : "bg-subtle text-fg-muted")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

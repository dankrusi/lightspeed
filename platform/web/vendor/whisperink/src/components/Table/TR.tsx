import type { HTMLAttributes, KeyboardEvent, MouseEvent } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/** Controls inside a row act for themselves; a press on one is not a press on the row. */
const ROW_CONTROL = "a, button, input, select, textarea, label, [role='menu']";

/**
 * Table row. With `clickable` and an `onClick` the whole row opens what it
 * stands for: it takes keyboard focus and answers Enter, and a press on a
 * checkbox, button or link inside it stays with that control instead of also
 * opening the row.
 * @category data
 */
export function TR({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, selected, clickable, onClick, onKeyDown, ...props }: (HTMLAttributes<HTMLTableRowElement> & { selected?: boolean; clickable?: boolean }) & UiMetadataProps) {
  const _ui = uiMetadata("table-row", "Display a table row", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const interactive = Boolean(clickable && onClick);
  const fromControl = (event: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>) => {
    const control = (event.target as HTMLElement).closest(ROW_CONTROL);
    return control !== null && event.currentTarget.contains(control);
  };
  return (
    <tr
      className={cn(
        "transition-colors",
        clickable && "cursor-pointer hover:bg-subtle/60",
        // The outline is drawn inside the row: the scrolling wrapper clips anything outside it.
        interactive && "focus-visible:bg-subtle/60 focus-visible:[outline-offset:-2px]",
        selected && "bg-subtle",
        className,
      )}
      aria-selected={selected || undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? (event) => { if (!fromControl(event)) onClick?.(event); } : onClick}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!interactive || event.defaultPrevented || event.key !== "Enter" || event.target !== event.currentTarget) return;
        event.preventDefault();
        event.currentTarget.click();
      }}
      {...props} {..._ui.attributes}
    />
  );
}

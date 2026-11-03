import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Bulk-action bar shown while rows are selected; the count is announced as the selection changes.
 * @category data
 */
export function SelectionBar({ uiId, uiDescription, uiComponentId, uiComponentDescription, count, onClear, children, className }: ({ count: number; onClear: () => void; children: ReactNode; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("selection-bar", "Act on selected items", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  if (!count) return null;
  return (
    <div className={cn("flex animate-fade-in flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-fg px-3 py-2 text-sm text-fg-inverse shadow-md", className)} {..._ui.attributes}>
      <span className="font-medium tabular-nums" role="status">{text.table.selected(count)}</span>
      <span className="h-4 w-px bg-fg-inverse/25" aria-hidden="true" />
      {/* Not the entries of a menu opened from the bar: that is an ordinary surface again. */}
      <div className="flex items-center gap-1 [&_:is(button,a):not([role^=menuitem])]:text-fg-inverse [&_:is(button,a):not([role^=menuitem]):hover]:bg-fg-inverse/10">{children}</div>
      <button type="button" onClick={onClear} className="ml-auto rounded text-xs text-fg-inverse/70 underline-offset-2 outline-none hover:underline focus-visible:text-fg-inverse focus-visible:underline focus-visible:ring-2 focus-visible:ring-fg-inverse/70">{text.table.clearSelection}</button>
    </div>
  );
}

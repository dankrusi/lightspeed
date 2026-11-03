import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Labelled values as a description list in one to three columns.
 * @category data
 */
export function KeyValue({ uiId, uiDescription, uiComponentId, uiComponentDescription, items, columns = 2, className }: ({ items: readonly [string, ReactNode][]; columns?: 1 | 2 | 3; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("key-value", "Show labelled values", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const grid = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[columns];
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", grid, className)} {..._ui.attributes}>
      {items.map(([term, value]) => (
        <div key={term} className="min-w-0">
          <dt className="text-xs font-medium text-fg-muted">{term}</dt>
          <dd className="mt-1 break-words text-base">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

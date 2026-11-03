import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Body rows of a `Table`, with the row height and dividers.
 * @category data
 */
export function TBody({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, ...props }: (HTMLAttributes<HTMLTableSectionElement>) & UiMetadataProps) {
  const _ui = uiMetadata("table-body", "Group table rows", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <tbody className={cn("[&_td]:h-12 [&_td]:border-b [&_td]:border-border [&_td]:px-4 [&_tr:last-child_td]:border-0", className)} {...props} {..._ui.attributes} />;
}

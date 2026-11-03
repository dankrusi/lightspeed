import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Heading rows of a `Table`.
 * @category data
 */
export function THead({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, ...props }: (HTMLAttributes<HTMLTableSectionElement>) & UiMetadataProps) {
  const _ui = uiMetadata("table-head", "Group table headings", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <thead className={cn("bg-subtle/70 text-xs font-medium text-fg-muted [&_th]:h-10 [&_th]:border-b [&_th]:border-border [&_th]:px-4 [&_th]:font-medium", className)} {...props} {..._ui.attributes} />;
}

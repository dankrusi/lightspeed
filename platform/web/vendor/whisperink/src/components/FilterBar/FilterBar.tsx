import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Filter/search controls on the left, primary action on the right; wraps on small screens.
 * @category forms
 */
export function FilterBar({ uiId, uiDescription, uiComponentId, uiComponentDescription, children, className }: ({ children: ReactNode; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("filter-bar", "Group content filters", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <div className={cn("flex flex-wrap items-center justify-between gap-2", className)} {..._ui.attributes}>{children}</div>;
}

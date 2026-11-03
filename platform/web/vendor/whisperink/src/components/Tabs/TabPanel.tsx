import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Panel associated with a tab; pass the same `id` you gave `Tabs`.
 * @category navigation
 */
export function TabPanel({ uiId, uiDescription, uiComponentId, uiComponentDescription, id, value, active, className, children }: ({ id: string; value: string; active: boolean; className?: string; children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("tab-panel", "Show the selected view", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  if (!active) return null;
  return <div role="tabpanel" id={`${id}-${value}-panel`} aria-labelledby={`${id}-${value}`} tabIndex={0} className={cn("focus-ring rounded-sm", className)} {..._ui.attributes}>{children}</div>;
}

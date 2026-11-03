import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Attached buttons (toolbar clusters, split buttons, header action groups):
 * neighbours share an edge and one outer shadow; only the outer corners keep the radius. Children may
 * be buttons or wrappers around a button (e.g. a `Menu` trigger).
 * @category actions
 */
export function ButtonGroup({ uiId, uiDescription, uiComponentId, uiComponentDescription, children, className, label }: ({ children: ReactNode; className?: string; /** Accessible name of the group. */ label?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("button-group", "Group related actions", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <div role="group" aria-label={label} className={cn("button-group", className)} {..._ui.attributes}>
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Overline label used above groups of content.
 * @category layout
 */
export function Eyebrow({ uiId, uiDescription, uiComponentId, uiComponentDescription, children, className }: ({ children: ReactNode; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("eyebrow", "Introduce a content section", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <p className={cn("text-2xs font-semibold uppercase tracking-wider text-fg-muted", className)} {..._ui.attributes}>{children}</p>;
}

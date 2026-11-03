import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Section heading with a rule and optional trailing action.
 * @category layout
 */
export function SectionHeading({ uiId, uiDescription, uiComponentId, uiComponentDescription, title, action, className }: ({ title: ReactNode; action?: ReactNode; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("section-heading", "Name a content section", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-border pb-2", className)} {..._ui.attributes}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {action}
    </div>
  );
}

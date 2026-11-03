import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Small numeric counter, e.g. unread items.
 * @category data
 */
export function Counter({ uiId, uiDescription, uiComponentId, uiComponentDescription, children, className }: ({ children: ReactNode; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("counter", "Show a count", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-2xs font-semibold text-primary-fg", className)} {..._ui.attributes}>
      {children}
    </span>
  );
}

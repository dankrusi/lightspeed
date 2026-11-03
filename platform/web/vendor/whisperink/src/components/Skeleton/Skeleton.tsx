import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Loading placeholder. Considered bad UX in Whisperink; avoid whenever possible.
 * @category feedback
 */
export function Skeleton({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, ...props }: (HTMLAttributes<HTMLDivElement>) & UiMetadataProps) {
  const _ui = uiMetadata("skeleton", "Reserve space while content loads", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <div className={cn("skeleton", className)} aria-hidden="true" {...props} {..._ui.attributes} />;
}

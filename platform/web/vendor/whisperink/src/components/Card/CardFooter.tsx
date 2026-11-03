import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Bottom row of a `Card` for its own buttons, aligned right.
 * @category layout
 */
export function CardFooter({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, ...props }: (HTMLAttributes<HTMLDivElement>) & UiMetadataProps) {
  const _ui = uiMetadata("card-footer", "Show card footer content", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <div className={cn("flex items-center justify-end gap-2 border-t border-border bg-subtle/60 px-5 py-3", className)} {...props} {..._ui.attributes} />;
}

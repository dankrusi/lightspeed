import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Padded body of a `Card`.
 * @category layout
 */
export function CardContent({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, ...props }: (HTMLAttributes<HTMLDivElement>) & UiMetadataProps) {
  const _ui = uiMetadata("card-content", "Display card content", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <div className={cn("p-5", className)} {...props} {..._ui.attributes} />;
}

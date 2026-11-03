import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Surface that groups related content. Compose it from `CardHeader`,
 * `CardContent` and `CardFooter`.
 * @category layout
 */
export function Card({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, ...props }: (HTMLAttributes<HTMLDivElement>) & UiMetadataProps) {
  const _ui = uiMetadata("card", "Group related content", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <div className={cn("rounded-[var(--card-radius)] border-[length:var(--card-border-width)] border-[rgb(var(--card-border-color))] bg-surface text-fg shadow-card", className)} {...props} {..._ui.attributes} />;
}

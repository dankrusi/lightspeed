import { useState } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Photo when there is one that loads, initials otherwise: a broken address falls back rather than leaving a hole.
 * @category data
 */
export function Avatar({ uiId, uiDescription, uiComponentId, uiComponentDescription, initials, src, size = "md", className, label }: ({ initials: string; src?: string; size?: "sm" | "md" | "lg"; className?: string; /** Accessible name, e.g. the person's full name. */ label?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("avatar", "Identify a person", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const dimension = { sm: "size-6 text-2xs", md: "size-8 text-xs", lg: "size-10 text-sm" }[size];
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span role={label ? "img" : undefined} aria-label={label} title={label} className={cn("inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted font-semibold text-fg ring-1 ring-inset ring-border", dimension, className)} {..._ui.attributes}>
      {src && failed !== src ? <img src={src} alt="" onError={() => setFailed(src)} className="size-full object-cover" /> : <span aria-hidden={label ? "true" : undefined}>{initials}</span>}
    </span>
  );
}

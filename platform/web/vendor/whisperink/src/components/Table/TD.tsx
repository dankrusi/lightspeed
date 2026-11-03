import type { TdHTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Table cell. `align`, `numeric` (tabular figures) and `muted` cover the
 * usual cases.
 * @category data
 */
export function TD({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, align = "left", numeric, muted, ...props }: (TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right"; numeric?: boolean; muted?: boolean }) & UiMetadataProps) {
  const _ui = uiMetadata("table-cell", "Display a table value", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <td className={cn(align === "right" && "text-right", numeric && "tabular-nums", muted && "text-fg-muted", className)} {...props} {..._ui.attributes} />;
}

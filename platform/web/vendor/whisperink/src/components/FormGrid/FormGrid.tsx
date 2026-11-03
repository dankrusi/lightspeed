import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Grid for form fields: one column on narrow screens, up to `columns` from
 * the `md` breakpoint.
 * @category layout
 */
export function FormGrid({ uiId, uiDescription, uiComponentId, uiComponentDescription, columns = 2, className, children }: ({ columns?: 1 | 2 | 3 | 4; className?: string; children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("form-grid", "Arrange form controls", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const grid = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 xl:grid-cols-4" }[columns];
  return <div className={cn("grid gap-4", grid, className)} {..._ui.attributes}>{children}</div>;
}

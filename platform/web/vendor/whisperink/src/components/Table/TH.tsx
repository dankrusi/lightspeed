import type { ThHTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { ArrowDown, ArrowsDownUp, ArrowUp } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

export type SortDirection = "asc" | "desc" | null;

/**
 * Header cell; pass `sort` and `onSort` to make it sortable with a visible direction indicator.
 * @category data
 */
export function TH({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  className,
  align = "left",
  sort,
  onSort,
  children,
  ...props
}: (ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center"; sort?: SortDirection; onSort?: () => void }) & UiMetadataProps) {
  const _ui = uiMetadata("table-heading", "Label a table column", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const alignment = { left: "text-left", right: "text-right", center: "text-center" }[align];
  if (!onSort) return <th scope="col" className={cn(alignment, className)} {...props} {..._ui.attributes}>{children}</th>;
  const Icon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ArrowsDownUp;
  return (
    <th scope="col" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"} className={cn(alignment, "p-0", className)} {...props} {..._ui.attributes}>
      <button
        type="button"
        onClick={onSort}
        className={cn("focus-ring inline-flex h-10 w-full items-center gap-1 px-4 hover:text-fg", align === "right" && "flex-row-reverse", sort && "text-fg")}
      >
        {children}
        <Icon className={cn("size-3.5", sort ? "text-fg" : "text-fg-subtle")} aria-hidden="true" />
      </button>
    </th>
  );
}

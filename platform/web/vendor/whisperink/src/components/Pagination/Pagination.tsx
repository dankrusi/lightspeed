import { cn } from "../../cn.js";
import { CaretLeft, CaretRight } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";
import { Select } from "../Select/Select.js";

/**
 * Page navigation for a result list: the range shown out of the total,
 * previous and next, page numbers and, with `onPageSize`, the page size.
 * @category navigation
 */
export function Pagination({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  page,
  pageCount,
  pageSize,
  total,
  onPage,
  onPageSize,
  pageSizes = [10, 25, 50, 100],
  className,
}: ({
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  /** Page sizes offered when `onPageSize` is given. */
  pageSizes?: readonly number[];
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("pagination", "Navigate between result pages", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label={text.table.pagination} className={cn("flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted", className)} {..._ui.attributes}>
      <div className="flex items-center gap-3">
        <span className="tabular-nums" aria-live="polite">{text.table.range(from, to, total)}</span>
        {onPageSize && (
          <Select size="sm" value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))} className="w-28" aria-label={text.table.rowsPerPage}>
            {/* The size in force is always listed, even when it is not one of the offered steps. */}
            {[...new Set([...pageSizes, pageSize])].sort((left, right) => left - right).map((size) => <option key={size} value={size}>{text.table.perPage(size)}</option>)}
          </Select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <IconButton label={text.table.previousPage} size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}><CaretLeft /></IconButton>
        {pageNumbers(page, pageCount).map((entry, index) =>
          entry === "…" ? (
            <span key={`gap-${index}`} className="w-6 text-center text-fg-subtle" aria-hidden="true">…</span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? "page" : undefined}
              aria-label={text.table.page(entry)}
              onClick={() => onPage(entry)}
              className={cn("focus-ring h-8 min-w-8 rounded px-2 text-sm font-medium tabular-nums transition-colors", entry === page ? "bg-primary text-primary-fg" : "text-fg hover:bg-subtle")}
            >
              {entry}
            </button>
          ),
        )}
        <IconButton label={text.table.nextPage} size="sm" variant="outline" disabled={page >= pageCount} onClick={() => onPage(page + 1)}><CaretRight /></IconButton>
      </div>
    </nav>
  );
}

function pageNumbers(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  const pages = new Set([1, count, page - 1, page, page + 1].filter((value) => value >= 1 && value <= count));
  const sorted = [...pages].sort((left, right) => left - right);
  const result: (number | "…")[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push("…");
    result.push(value);
  });
  return result;
}

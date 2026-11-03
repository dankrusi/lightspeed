import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Title, description, meta and tabs of a page. Deliberately has no action slot:
 * page functions (save, delete, export, …) belong in the app bar via `WebApp`
 * `actions` / `usePageActions`, so they sit in the same place on every screen.
 * @category shell
 */
export function PageHeader({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  title,
  description,
  meta,
  tabs,
  className,
}: ({
  title: string;
  description?: string;
  meta?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("page-header", "Introduce the current page", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <div className={cn("border-b border-border pb-0", tabs ? "mb-6" : "mb-6 pb-5", className)} {..._ui.attributes}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {/* The header's own rule is the tab bar's: the bar gives up its own and sits on it. */}
      {tabs && <div className="-mb-px mt-4 [&>[role=tablist]]:shadow-none">{tabs}</div>}
    </div>
  );
}

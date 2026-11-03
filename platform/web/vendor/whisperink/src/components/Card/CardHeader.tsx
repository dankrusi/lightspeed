import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Title of a `Card` with an optional description and actions on the right,
 * ruled off from the content.
 * @category layout
 */
export function CardHeader({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  title,
  description,
  action,
  className,
}: ({
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("card-header", "Introduce card content", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-border px-5 py-4", className)} {..._ui.attributes}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-5">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

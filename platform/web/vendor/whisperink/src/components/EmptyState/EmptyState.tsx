import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import type { Icon } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Stands in for a view with nothing to show: an optional icon, a title, an
 * explanation and the next action. `compact` uses less padding, e.g. inside a card.
 * @category feedback
 */
export function EmptyState({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  icon: Icon,
  title,
  description,
  action,
  compact,
  className,
}: ({
  icon?: Icon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("empty-state", "Explain an empty view", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <div className={cn("grid place-items-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)} {..._ui.attributes}>
      {Icon && (
        <span className="mb-4 grid size-11 place-items-center rounded-full border border-border bg-subtle text-fg-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5 flex gap-2">{action}</div>}
    </div>
  );
}

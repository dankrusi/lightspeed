import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Card } from "../Card/Card.js";

/**
 * Stat tile for dashboards: label, value, delta.
 * @category data
 */
export function Stat({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  label,
  value,
  delta,
  trend,
  icon,
  className,
}: ({
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: ReactNode;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("stat", "Show a key metric", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const trendClass = trend === "up" ? "text-success-fg" : trend === "down" ? "text-danger-fg" : "text-fg-muted";
  return (
    <Card className={cn("p-5", className)} {..._ui.props}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon && <span className="grid size-8 place-items-center rounded-md bg-subtle text-fg-muted [&_svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {delta && <p className={cn("mt-1 text-xs font-medium", trendClass)}>{delta}</p>}
    </Card>
  );
}

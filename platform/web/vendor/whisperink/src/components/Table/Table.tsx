import type { HTMLAttributes } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Data table that scrolls sideways when it does not fit. Build it from
 * `THead`, `TBody`, `TR`, `TH` and `TD`.
 * @category data
 */
export function Table({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, ...props }: (HTMLAttributes<HTMLTableElement>) & UiMetadataProps) {
  const _ui = uiMetadata("table", "Display tabular data", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <div className="scrollbar-thin w-full overflow-x-auto" {..._ui.attributes}>
      <table className={cn("w-full border-collapse text-left text-base", className)} {...props} />
    </div>
  );
}

import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Skeleton } from "./Skeleton.js";

/**
 * Table-shaped loading placeholder. Avoid whenever possible; prefer retaining existing content during refresh.
 * @category feedback
 */
export function SkeletonRows({ uiId, uiDescription, uiComponentId, uiComponentDescription, rows = 4 }: ({ rows?: number }) & UiMetadataProps) {
  const _ui = uiMetadata("skeleton-rows", "Reserve rows while content loads", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  return (
    <div className="grid gap-3" role="status" aria-busy="true" aria-label={text.feedback.loading} {..._ui.attributes}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

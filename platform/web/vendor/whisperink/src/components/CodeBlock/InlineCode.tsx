import type { ReactNode } from "react";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Code inside running text.
 * @category content
 */
export function InlineCode({ uiId, uiDescription, uiComponentId, uiComponentDescription, children }: ({ children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("inline-code", "Display inline source code", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <code className="rounded border border-border bg-subtle px-1 py-0.5 font-mono text-[12px] text-fg" {..._ui.attributes}>{children}</code>;
}

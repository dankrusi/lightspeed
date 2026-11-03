import type { ReactNode } from "react";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * A keyboard key or shortcut, such as `Ctrl` or `K`.
 * @category data
 */
export function Kbd({ uiId, uiDescription, uiComponentId, uiComponentDescription, children }: ({ children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("kbd", "Show a keyboard shortcut", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-subtle px-1.5 font-sans text-2xs font-medium text-fg-muted shadow-[inset_0_-1px_0_rgb(var(--border))]" {..._ui.attributes}>
      {children}
    </kbd>
  );
}

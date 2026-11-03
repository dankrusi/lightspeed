import type { ReactNode } from "react";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Heading for a group of entries inside a `Menu`.
 * @category menu
 */
export function MenuLabel({ uiId, uiDescription, uiComponentId, uiComponentDescription, children }: ({ children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("menu-label", "Label a menu section", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <p className="px-2 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-subtle" {..._ui.attributes}>{children}</p>;
}

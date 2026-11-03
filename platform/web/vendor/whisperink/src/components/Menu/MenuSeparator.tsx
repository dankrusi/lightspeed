import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Rule between groups of entries inside a `Menu`.
 * @category menu
 */
export function MenuSeparator({ uiId, uiDescription, uiComponentId, uiComponentDescription }: UiMetadataProps = {}) {
  const _ui = uiMetadata("menu-separator", "Separate menu sections", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <div role="separator" className="my-1 h-px bg-border" {..._ui.attributes} />;
}

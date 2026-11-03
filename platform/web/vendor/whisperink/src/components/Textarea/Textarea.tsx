import type { ComponentProps } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Multi-line text field the user can resize vertically. Wire it through
 * `Field` for its label and hint.
 * @category forms
 */
export function Textarea({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, invalid, ...props }: (ComponentProps<"textarea"> & { invalid?: boolean }) & UiMetadataProps) {
  const _ui = uiMetadata("textarea", "Enter multiline text", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return <textarea className={cn("control min-h-24 w-full resize-y py-2 leading-5", invalid && "control-invalid", className)} aria-invalid={invalid || undefined} {...props} {..._ui.attributes} />;
}

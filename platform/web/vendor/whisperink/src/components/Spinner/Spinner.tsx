import { cn } from "../../cn.js";
import { CircleNotch } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Loading indicator without progress, announced to screen readers by its
 * `label` (the kit's loading text by default). Prefer keeping content visible
 * while it refreshes over replacing it with a spinner.
 * @category feedback
 */
export function Spinner({ uiId, uiDescription, uiComponentId, uiComponentDescription, size = "md", className, label }: ({ size?: "sm" | "md" | "lg"; className?: string; label?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("spinner", "Indicate an ongoing operation", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const dimension = { sm: "size-4", md: "size-5", lg: "size-7" }[size];
  return <CircleNotch role="status" aria-label={label ?? text.feedback.loading} className={cn("animate-spin text-fg-muted", dimension, className)} {..._ui.attributes} />;
}

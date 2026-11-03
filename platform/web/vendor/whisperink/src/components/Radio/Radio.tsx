import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Radio button, optionally with a label and a description. Give the
 * alternatives of one choice the same `name`.
 * @category forms
 */
export function Radio({ uiId, uiDescription, uiComponentId, uiComponentDescription, label, description, className, ...props }: (ComponentProps<"input"> & { label?: ReactNode; description?: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("radio", "Choose one alternative", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const dot = (
    <input
      type="radio"
      className="focus-ring size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-border-strong bg-surface transition-colors checked:border-[5px] checked:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      {...props} {..._ui.attributes}
    />
  );
  if (!label) return dot;
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60", className)} {..._ui.attributes}>
      <span className="mt-0.5">{dot}</span>
      <span className="min-w-0">
        <span className="block text-base leading-5">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-fg-muted">{description}</span>}
      </span>
    </label>
  );
}

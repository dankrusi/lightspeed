import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Toggle switch for immediate on/off settings (the old UI had none).
 * @category forms
 */
export function Switch({ uiId, uiDescription, uiComponentId, uiComponentDescription, label, description, className, ...props }: (ComponentProps<"input"> & { label?: ReactNode; description?: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("switch", "Toggle a setting", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const control = (
    <span className="relative inline-flex h-5 w-9 shrink-0" {..._ui.attributes}>
      <input
        type="checkbox"
        role="switch"
        className="focus-ring peer absolute inset-0 cursor-pointer appearance-none rounded-full bg-muted transition-colors checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {/* Light on the unchecked track in both themes; on the checked one it takes the colour that reads against the primary fill. */}
      <span className="pointer-events-none absolute left-0.5 top-0.5 size-4 rounded-full bg-[rgb(var(--neutral-0))] shadow-sm transition-transform peer-checked:translate-x-4 peer-checked:bg-primary-fg" />
    </span>
  );
  if (!label) return control;
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60", className)} {..._ui.attributes}>
      <span className="min-w-0">
        <span className="block text-base leading-5">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-fg-muted">{description}</span>}
      </span>
      {control}
    </label>
  );
}

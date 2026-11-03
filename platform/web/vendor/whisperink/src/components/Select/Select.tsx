import type { ComponentProps } from "react";
import { cn } from "../../cn.js";
import { CaretDown } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Native select in the kit's control style; pass `<option>` children.
 * @category forms
 */
export function Select({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, invalid, size = "md", children, ...props }: (Omit<ComponentProps<"select">, "size"> & { invalid?: boolean; size?: "sm" | "md" | "lg" }) & UiMetadataProps) {
  const _ui = uiMetadata("select", "Choose an option", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  // The standard height comes from `.control`, so a `className` that sets its own still wins.
  const height = { sm: "h-8 text-sm", md: undefined, lg: "h-10" }[size];
  return (
    <span className="relative block" {..._ui.attributes}>
      <select className={cn("control w-full appearance-none pr-9", height, invalid && "control-invalid", className)} aria-invalid={invalid || undefined} {...props}>
        {children}
      </select>
      <CaretDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
    </span>
  );
}

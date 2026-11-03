import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Single-line text field. `leading` and `trailing` place icons inside it,
 * `invalid` marks an error. Wire it through `Field` for its label and hint.
 * @category forms
 */
export function Input({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  className,
  invalid,
  leading,
  trailing,
  size = "md",
  ...props
}: (Omit<ComponentProps<"input">, "size"> & { invalid?: boolean; leading?: ReactNode; trailing?: ReactNode; size?: "sm" | "md" | "lg" }) & UiMetadataProps) {
  const _ui = uiMetadata("input", "Enter a text value", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const height = { sm: "h-8 text-sm", md: "h-9", lg: "h-10" }[size];
  const input = (
    <input
      className={cn("control w-full", height, invalid && "control-invalid", leading && "pl-9", trailing && "pr-9", className)}
      aria-invalid={invalid || undefined}
      {...props} {..._ui.attributes}
    />
  );
  if (!leading && !trailing) return input;
  return (
    <span className="relative block" {..._ui.attributes}>
      {leading && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle [&_svg]:size-4">{leading}</span>}
      {input}
      {trailing && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle [&_svg]:size-4">{trailing}</span>}
    </span>
  );
}

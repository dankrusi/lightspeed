import type { ComponentProps, ReactNode, Ref } from "react";
import { cn } from "../../cn.js";
import { Check, Minus } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * Custom-drawn checkbox with indeterminate support; the native input stays for semantics.
 *
 * A box on some of what it covers is drawn from `:indeterminate` as well as
 * `:checked`, because those do not both match: a browser stops matching
 * `:checked` the moment an input is made indeterminate, so a partly checked box
 * styled from `:checked` alone is drawn as an empty one and says the opposite of
 * what it means.
 * @category forms
 */
export function Checkbox({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  label,
  description,
  indeterminate,
  className,
  ref,
  ...props
}: (ComponentProps<"input"> & { label?: ReactNode; description?: ReactNode; indeterminate?: boolean }) & UiMetadataProps) {
  const _ui = uiMetadata("checkbox", "Toggle an independent choice", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const box = (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center" {..._ui.attributes}>
      <input
        type="checkbox"
        className="focus-ring peer absolute inset-0 size-4 cursor-pointer appearance-none rounded border border-border-strong bg-surface transition-colors checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        ref={(element) => { if (element) element.indeterminate = Boolean(indeterminate); assignRef(ref, element); }}
        aria-checked={indeterminate ? "mixed" : undefined}
        {...props}
      />
      {indeterminate ? (
        <Minus className="pointer-events-none relative size-3 text-primary-fg opacity-0 peer-indeterminate:opacity-100" strokeWidth={3} />
      ) : (
        <Check className="pointer-events-none relative size-3 text-primary-fg opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      )}
    </span>
  );
  if (!label) return box;
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60", className)} {..._ui.attributes}>
      <span className="mt-0.5">{box}</span>
      <span className="min-w-0">
        <span className="block text-base leading-5">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-fg-muted">{description}</span>}
      </span>
    </label>
  );
}

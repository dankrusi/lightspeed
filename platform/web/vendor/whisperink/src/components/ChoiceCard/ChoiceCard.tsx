import type { ReactNode } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Option card: a whole bordered panel acts as the checkbox/radio label.
 * The card marks itself from the control inside it, so `selected` is only
 * needed when the card should look chosen without a checked control.
 * @category forms
 */
export function ChoiceCard({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  title,
  description,
  control,
  selected,
  className,
}: ({
  title: ReactNode;
  description?: ReactNode;
  control: ReactNode;
  selected?: boolean;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("choice-card", "Choose a described alternative", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border bg-surface p-4 transition-colors hover:bg-subtle/60 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
        selected ? "border-primary ring-1 ring-primary" : "border-border",
        className,
      )} {..._ui.attributes}
    >
      <span className="mt-0.5">{control}</span>
      <span className="min-w-0">
        <span className="block text-base font-medium leading-5">{title}</span>
        {description && <span className="mt-1 block text-xs text-fg-muted">{description}</span>}
      </span>
    </label>
  );
}

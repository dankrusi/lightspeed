import { type ReactNode, useId } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Label + control row used inside panel sections.
 *
 * `actions` is the row's own affordances, sitting in a track of their own at the
 * end of the row: revert buttons, a lock, a link to whatever the value came
 * from. They get a column rather than a corner of the control so that a panel of
 * rows lines them up, which is what makes a column of them readable as a column.
 * A row without any keeps the plain two-track grid and the wider control.
 *
 * The row is a group named by its label, so whatever control sits in it — a
 * slider, a bare checkbox, three number fields — is announced with the
 * property it edits without each one having to be labelled again.
 * @category workspace
 */
export function PropertyRow({ uiId, uiDescription, uiComponentId, uiComponentDescription, label, children, hint, actions }: ({
  label: string;
  children: ReactNode;
  hint?: string;
  actions?: ReactNode;
}) & UiMetadataProps) {
  const _ui = uiMetadata("property-row", "Label a property control", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={cn("grid items-center", actions ? "grid-cols-[minmax(72px,96px)_1fr_auto] gap-1.5" : "grid-cols-[minmax(96px,120px)_1fr] gap-3")} {..._ui.attributes}>
      <span id={id} className="truncate text-xs text-fg-muted" title={hint ?? label}>{label}</span>
      <div className="min-w-0">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
    </div>
  );
}

import { type ReactNode, useState } from "react";
import { CaretDown, CaretRight } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Collapsible property group with an optional right-aligned meta caption.
 * @category workspace
 */
export function PanelSection({ uiId, uiDescription, uiComponentId, uiComponentDescription, title, meta, defaultOpen = true, children }: ({ title: string; meta?: ReactNode; defaultOpen?: boolean; children: ReactNode }) & UiMetadataProps) {
  const _ui = uiMetadata("panel-section", "Group panel controls", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border last:border-0" {..._ui.attributes}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex h-9 w-full items-center gap-2 px-3 text-left hover:bg-subtle/60"
      >
        {open ? <CaretDown className="size-3.5 text-fg-subtle" /> : <CaretRight className="size-3.5 text-fg-subtle" />}
        <span className="flex-1 truncate text-sm font-semibold">{title}</span>
        {meta && <span className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">{meta}</span>}
      </button>
      {/* A single `minmax(0, 1fr)` track keeps a row with unbreakable content (a path, a file name) from widening the section past its panel. */}
      {open && <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-3 pb-4 pt-1">{children}</div>}
    </section>
  );
}

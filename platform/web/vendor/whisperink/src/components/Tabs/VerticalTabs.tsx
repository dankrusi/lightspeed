import { cn } from "../../cn.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import type { TabItem } from "./roving.js";

/**
 * Vertical navigation tabs for settings-style pages.
 * @category navigation
 */
export function VerticalTabs({ uiId, uiDescription, uiComponentId, uiComponentDescription, items, value, onChange, className, label }: ({ items: readonly TabItem[]; value: string; onChange: (value: string) => void; className?: string; /** Accessible name of the navigation; defaults to the kit's wording. */ label?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("vertical-tabs", "Navigate between sections", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  return (
    <nav className={cn("grid gap-0.5", className)} aria-label={label ?? text.nav.sections} {..._ui.attributes}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-current={selected ? "page" : undefined}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            {...uiMetadata("vertical-tab", "Open one section", item).attributes}
            className={cn(
              "focus-ring flex h-8 items-center gap-2 rounded px-2.5 text-left text-base font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
              selected ? "bg-subtle text-fg" : "text-fg-muted hover:bg-subtle/70 hover:text-fg",
            )}
          >
            {item.icon}
            <span className="flex-1 truncate">{item.label}</span>
            {item.count !== undefined && <span className="text-xs tabular-nums text-fg-subtle">{item.count}</span>}
          </button>
        );
      })}
    </nav>
  );
}

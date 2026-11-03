import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { roving, type TabItem } from "./roving.js";

/**
 * Segmented control for view or filter toggles; keeps the pill look but with a clear selected state.
 * @category actions
 */
export function Segmented({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  items,
  value,
  onChange,
  size = "md",
  className,
  label,
}: ({
  items: readonly TabItem[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("segmented", "Choose between related options", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const height = size === "sm" ? "h-7 px-2.5 text-sm" : "h-8 px-3 text-base";
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex gap-0.5 rounded-[var(--segmented-radius)] bg-subtle p-0.5", className)} onKeyDown={(event) => roving(event, items, value, onChange)} {..._ui.attributes}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            data-value={item.value}
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              "focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--segmented-item-radius)] font-medium transition-all disabled:opacity-40 [&_svg]:size-3.5",
              height,
              selected ? "bg-surface text-fg shadow-segmented" : "text-fg-muted hover:text-fg",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

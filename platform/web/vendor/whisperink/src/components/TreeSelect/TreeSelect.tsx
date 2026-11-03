import type { ComponentProps, ReactNode } from "react";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Select } from "../Select/Select.js";

export type TreeSelectItem = {
  value: string;
  label: string;
  disabled?: boolean;
  children?: readonly TreeSelectItem[];
};

type FlatTreeSelectItem = { item: TreeSelectItem; depth: number };

function flattenTreeSelectItems(items: readonly TreeSelectItem[], depth = 0): FlatTreeSelectItem[] {
  return items.flatMap((item) => [
    { item, depth },
    ...flattenTreeSelectItems(item.children ?? [], depth + 1),
  ]);
}

/**
 * Native select for hierarchical data. Nested items remain keyboard- and
 * platform-native while non-breaking indentation keeps their ancestry visible
 * in browsers that collapse ordinary option whitespace.
 * @category forms
 */
export function TreeSelect({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  items,
  children,
  ...props
}: (Omit<ComponentProps<"select">, "children" | "size"> & {
  items: readonly TreeSelectItem[];
  /** Flat options rendered before the hierarchy, such as an empty/root choice. */
  children?: ReactNode;
  invalid?: boolean;
  size?: "sm" | "md" | "lg";
}) & UiMetadataProps) {
  const _ui = uiMetadata("tree-select", "Choose a hierarchical option", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <Select {...props} {..._ui.props}>
      {children}
      {flattenTreeSelectItems(items).map(({ item, depth }) => (
        <option key={item.value} value={item.value} disabled={item.disabled}>
          {depth > 0 ? `${"\u00a0\u00a0".repeat(depth)}↳ ` : ""}{item.label}
        </option>
      ))}
    </Select>
  );
}

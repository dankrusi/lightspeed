import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { CaretRight, Check, Minus } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/** One node of the tree. Its metadata identifies the node's row. */
export type TreeListItem = UiMetadataProps & {
  id: string;
  label: ReactNode;
  /** Accessible fallback when `label` is not plain text. */
  textValue?: string;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  children?: readonly TreeListItem[];
};

type TreeListBaseProps = {
  items: readonly TreeListItem[];
  /** Accessible name for the tree. */
  label: string;
  className?: string;
  variant?: "bordered" | "plain";
  density?: "compact" | "default";
  showLines?: boolean;
  empty?: ReactNode;
  /** Controlled expanded branch IDs. */
  expandedIds?: readonly string[];
  /** Initial expansion for an uncontrolled tree. */
  defaultExpandedIds?: readonly string[] | "all";
  onExpandedIdsChange?: (ids: string[]) => void;
  /** Called on Enter, double click, or a click in navigation mode. */
  onActivate?: (item: TreeListItem) => void;
};

type CheckboxTreeListProps = TreeListBaseProps & {
  selectionMode: "checkbox";
  selectedIds: readonly string[];
  onSelectedIdsChange: (ids: string[]) => void;
  /** Selecting a branch selects its enabled descendants and derives mixed parent state. */
  cascade?: boolean;
};

type RadioTreeListProps = TreeListBaseProps & {
  selectionMode: "radio";
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
  allowDeselect?: boolean;
};

type NavigationTreeListProps = TreeListBaseProps & {
  selectionMode?: "none";
};

export type TreeListProps = (CheckboxTreeListProps | RadioTreeListProps | NavigationTreeListProps) & UiMetadataProps;

type FlatItem = { item: TreeListItem; parentId: string | null; depth: number };

function flatten(items: readonly TreeListItem[], parentId: string | null = null, depth = 0): FlatItem[] {
  return items.flatMap((item) => [
    { item, parentId, depth },
    ...flatten(item.children ?? [], item.id, depth + 1),
  ]);
}

function visible(items: readonly TreeListItem[], expanded: ReadonlySet<string>, parentId: string | null = null, depth = 0): FlatItem[] {
  return items.flatMap((item) => [
    { item, parentId, depth },
    ...(item.children?.length && expanded.has(item.id) ? visible(item.children, expanded, item.id, depth + 1) : []),
  ]);
}

function selectable(item: TreeListItem): string[] {
  return [
    ...(item.disabled ? [] : [item.id]),
    ...(item.children ?? []).flatMap(selectable),
  ];
}

function cascadeStateIds(item: TreeListItem): string[] {
  const descendants = (item.children ?? []).flatMap(cascadeStateIds);
  return descendants.length ? descendants : item.disabled ? [] : [item.id];
}

/** What a row is called when typing to find it. */
function textOf(item: TreeListItem): string {
  return item.textValue ?? (typeof item.label === "string" ? item.label : item.id);
}

/**
 * Hierarchical list with independent or cascading checkboxes, single-choice
 * radios, or navigation-only rows. Branches support controlled expansion and
 * the ARIA tree keyboard model (arrows, Home/End, *, Space, and Enter), and
 * typing moves to the next visible row that starts with what was typed.
 * @category data
 */
export function TreeList(props: (TreeListProps) & UiMetadataProps) {
  const _ui = uiMetadata("tree-list", "Explore hierarchical items", props);
  const {
    items,
    label,
    className,
    variant = "bordered",
    density = "compact",
    showLines = true,
    empty,
    expandedIds,
    defaultExpandedIds = [],
    onExpandedIdsChange,
    onActivate,
  } = props;
  const text = useText();
  const allItems = useMemo(() => flatten(items), [items]);
  const itemById = useMemo(() => new Map(allItems.map((entry) => [entry.item.id, entry])), [allItems]);
  const expandableIds = useMemo(() => allItems.filter(({ item }) => item.children?.length).map(({ item }) => item.id), [allItems]);
  const expandableKey = expandableIds.join("\u0000");
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(() => new Set(defaultExpandedIds === "all" ? expandableIds : defaultExpandedIds));
  const expanded = expandedIds === undefined ? internalExpanded : new Set(expandedIds);
  const visibleItems = useMemo(() => visible(items, expanded), [items, expandedIds, internalExpanded, expandableKey]);
  const visibleKey = visibleItems.map(({ item }) => item.id).join("\u0000");
  const [activeId, setActiveId] = useState<string | null>(() => allItems[0]?.item.id ?? null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const typed = useRef({ text: "", at: 0 });

  useEffect(() => {
    if (expandedIds !== undefined || defaultExpandedIds !== "all") return;
    setInternalExpanded((current) => {
      if (expandableIds.every((id) => current.has(id))) return current;
      return new Set([...current, ...expandableIds]);
    });
  }, [defaultExpandedIds, expandableKey, expandedIds]);

  useEffect(() => {
    if (activeId !== null && visibleItems.some(({ item }) => item.id === activeId)) return;
    setActiveId(visibleItems[0]?.item.id ?? null);
  }, [activeId, visibleKey]);

  const publishExpanded = (next: Set<string>) => {
    if (expandedIds === undefined) setInternalExpanded(next);
    onExpandedIdsChange?.([...next]);
  };
  const toggleExpanded = (id: string, open?: boolean) => {
    const next = new Set(expanded);
    const shouldOpen = open ?? !next.has(id);
    shouldOpen ? next.add(id) : next.delete(id);
    publishExpanded(next);
  };
  const focusItem = (id: string) => {
    setActiveId(id);
    requestAnimationFrame(() => rowRefs.current.get(id)?.focus());
  };
  const checkboxState = (item: TreeListItem): { checked: boolean; mixed: boolean } => {
    if (props.selectionMode !== "checkbox") return { checked: false, mixed: false };
    const ids = props.cascade ? cascadeStateIds(item) : [item.id];
    const selected = new Set(props.selectedIds);
    const count = ids.filter((id) => selected.has(id)).length;
    return { checked: ids.length > 0 && count === ids.length, mixed: count > 0 && count < ids.length };
  };
  const isSelected = (item: TreeListItem) => props.selectionMode === "radio" && props.selectedId === item.id;
  const selectItem = (item: TreeListItem) => {
    if (item.disabled) return;
    if (props.selectionMode === "checkbox") {
      const ids = props.cascade ? selectable(item) : [item.id];
      const next = new Set(props.selectedIds);
      const remove = props.cascade ? checkboxState(item).checked : ids.length > 0 && ids.every((id) => next.has(id));
      ids.forEach((id) => remove ? next.delete(id) : next.add(id));
      props.onSelectedIdsChange([...next]);
    } else if (props.selectionMode === "radio") {
      props.onSelectedIdChange(props.allowDeselect && props.selectedId === item.id ? null : item.id);
    } else {
      onActivate?.(item);
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, entry: FlatItem) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = visibleItems.findIndex(({ item }) => item.id === entry.item.id);
    if (event.key === "ArrowDown" && index < visibleItems.length - 1) {
      event.preventDefault(); focusItem(visibleItems[index + 1]!.item.id);
    } else if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault(); focusItem(visibleItems[index - 1]!.item.id);
    } else if (event.key === "Home" && visibleItems.length) {
      event.preventDefault(); focusItem(visibleItems[0]!.item.id);
    } else if (event.key === "End" && visibleItems.length) {
      event.preventDefault(); focusItem(visibleItems[visibleItems.length - 1]!.item.id);
    } else if (event.key === "ArrowRight" && entry.item.children?.length) {
      event.preventDefault();
      if (!expanded.has(entry.item.id)) toggleExpanded(entry.item.id, true);
      else focusItem(entry.item.children[0]!.id);
    } else if (event.key === "ArrowLeft") {
      if (entry.item.children?.length && expanded.has(entry.item.id)) {
        event.preventDefault(); toggleExpanded(entry.item.id, false);
      } else if (entry.parentId) {
        event.preventDefault(); focusItem(entry.parentId);
      }
    } else if (event.key === "*") {
      const siblings = allItems.filter((candidate) => candidate.parentId === entry.parentId && candidate.item.children?.length);
      if (siblings.length) {
        event.preventDefault(); publishExpanded(new Set([...expanded, ...siblings.map(({ item }) => item.id)]));
      }
    } else if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault(); selectItem(entry.item);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (onActivate) onActivate(entry.item);
      else selectItem(entry.item);
    } else if (event.key.length === 1) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 600 ? event.key : typed.current.text + event.key, at: now };
      const needle = typed.current.text.toLocaleLowerCase();
      // A first letter moves on from the current row, so pressing it again cycles.
      const from = needle.length === 1 ? index + 1 : index;
      const match = [...visibleItems.slice(from), ...visibleItems.slice(0, from)].find(({ item }) => textOf(item).toLocaleLowerCase().startsWith(needle));
      if (match) { event.preventDefault(); focusItem(match.item.id); }
    }
  };

  const renderItems = (nodes: readonly TreeListItem[], parentId: string | null, depth: number): ReactNode => nodes.map((item, position) => {
    const children = item.children ?? [];
    const expandable = children.length > 0;
    const open = expandable && expanded.has(item.id);
    const check = checkboxState(item);
    const selected = check.checked || check.mixed || isSelected(item);
    const itemText = textOf(item);
    const entry = itemById.get(item.id) ?? { item, parentId, depth };
    return (
      <li key={item.id} role="none">
        <div
          ref={(element) => { if (element) rowRefs.current.set(item.id, element); else rowRefs.current.delete(item.id); }}
          role="treeitem"
          aria-level={depth + 1}
          aria-setsize={nodes.length}
          aria-posinset={position + 1}
          aria-expanded={expandable ? open : undefined}
          aria-disabled={item.disabled || undefined}
          aria-checked={props.selectionMode === "checkbox" ? (check.mixed ? "mixed" : check.checked) : undefined}
          aria-selected={props.selectionMode === "radio" ? isSelected(item) : undefined}
          tabIndex={activeId === item.id ? 0 : -1}
          onFocus={() => setActiveId(item.id)}
          onKeyDown={(event) => handleKeyDown(event, entry)}
          onClick={() => { setActiveId(item.id); selectItem(item); }}
          onDoubleClick={() => { if (props.selectionMode === "checkbox" || props.selectionMode === "radio") onActivate?.(item); }}
          {...uiMetadata("tree-item", "Show one node of the tree", item).attributes}
          className={cn(
            "focus-ring group/treeitem flex w-full items-start gap-2 rounded-md px-2 text-left transition-colors",
            density === "compact" ? "min-h-8 py-1.5 text-sm" : "min-h-10 py-2 text-base",
            item.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-subtle/70",
            selected && "bg-subtle",
          )}
        >
          {expandable ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label={open ? text.tree.collapse(itemText) : text.tree.expand(itemText)}
              title={open ? text.tree.collapse(itemText) : text.tree.expand(itemText)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => { event.stopPropagation(); focusItem(item.id); toggleExpanded(item.id); }}
              className="focus-ring -m-0.5 grid size-5 shrink-0 place-items-center rounded text-fg-subtle hover:bg-muted hover:text-fg"
            >
              <CaretRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
            </button>
          ) : <span className="size-4 shrink-0" aria-hidden="true" />}
          {props.selectionMode === "checkbox" && (
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors",
                check.checked || check.mixed ? "border-primary bg-primary text-primary-fg" : "border-border-strong bg-surface",
              )}
            >
              {check.mixed ? <Minus className="size-3" strokeWidth={3} /> : check.checked ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
          )}
          {props.selectionMode === "radio" && (
            <span aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0 rounded-full border bg-surface transition-colors", isSelected(item) ? "border-[5px] border-primary" : "border-border-strong")} />
          )}
          {item.icon && <span className="mt-0.5 shrink-0 text-fg-muted [&_svg]:size-4" aria-hidden="true">{item.icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium leading-5 text-fg">{item.label}</span>
            {item.description && <span className="mt-0.5 block text-xs leading-4 text-fg-muted">{item.description}</span>}
          </span>
          {item.meta && <span className="mt-0.5 shrink-0 text-xs text-fg-muted">{item.meta}</span>}
        </div>
        {open && (
          <ul role="group" className={cn("ml-3 pl-3", showLines && "border-l border-border")}>
            {renderItems(children, item.id, depth + 1)}
          </ul>
        )}
      </li>
    );
  });

  // The tree is one `minmax(0, 1fr)` track: a long unbreakable label or description truncates instead of widening the tree past its panel.
  return (
    <div className={cn(variant === "bordered" && "rounded-[var(--card-radius)] border border-border bg-surface", className)} {..._ui.attributes}>
      {items.length ? (
        <ul role="tree" aria-label={label} aria-multiselectable={props.selectionMode === "checkbox" || undefined} className="grid grid-cols-[minmax(0,1fr)] gap-0.5 p-1">
          {renderItems(items, null, 0)}
        </ul>
      ) : empty ? <div className="p-3 text-sm text-fg-muted">{empty}</div> : null}
    </div>
  );
}

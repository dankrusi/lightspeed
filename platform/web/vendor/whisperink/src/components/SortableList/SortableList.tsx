import { type DragEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { DotsSixVertical } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Drag-to-reorder list using native HTML drag events; the handle is the only
 * drag origin. The handle also moves its item with the arrow keys: it keeps
 * focus across the move, and where the item landed is announced.
 * @category data
 */
export function SortableList<T extends { id: string }>({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  items,
  onChange,
  render,
  className,
}: ({
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T) => ReactNode;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("sortable-list", "Reorder a list of items", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const list = useRef<HTMLUListElement>(null);
  /** The item just moved by keyboard, whose handle takes focus back once the list has re-ordered. */
  const moved = useRef<string | null>(null);
  useEffect(() => {
    if (!moved.current) return;
    list.current?.querySelector<HTMLElement>(`[data-handle=${JSON.stringify(moved.current)}]`)?.focus();
    moved.current = null;
  });
  const reorder = (fromId: string, to: number): boolean => {
    const from = items.findIndex((item) => item.id === fromId);
    if (from === -1 || to < 0 || to >= items.length || from === to) return false;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    return true;
  };
  const nudge = (id: string, to: number) => {
    if (!reorder(id, to)) return;
    moved.current = id;
    setAnnouncement(text.list.moved(to + 1, items.length));
  };
  const drop = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    reorder(dragging, items.findIndex((item) => item.id === targetId));
  };
  const prevent = (event: DragEvent) => event.preventDefault();
  return (
    <>
      <ul ref={list} className={cn("grid gap-1.5", className)} {..._ui.attributes}>
        {items.map((item) => (
          <li
            key={item.id}
            onDragOver={(event) => { prevent(event); setOver(item.id); }}
            onDragLeave={() => setOver(null)}
            onDrop={(event) => { prevent(event); drop(item.id); setOver(null); setDragging(null); }}
            className={cn(
              "flex items-center gap-2 rounded-md border border-border bg-surface pr-2 transition-shadow",
              dragging === item.id && "opacity-50",
              over === item.id && dragging !== item.id && "ring-2 ring-primary/30",
            )}
          >
            <button
              type="button"
              draggable
              data-handle={item.id}
              onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDragging(item.id); }}
              onDragEnd={() => { setDragging(null); setOver(null); }}
              onKeyDown={(event) => {
                const index = items.findIndex((entry) => entry.id === item.id);
                if (event.key === "ArrowUp") { event.preventDefault(); nudge(item.id, index - 1); }
                if (event.key === "ArrowDown") { event.preventDefault(); nudge(item.id, index + 1); }
              }}
              className="focus-ring grid h-10 w-8 cursor-grab place-items-center rounded text-fg-subtle hover:text-fg active:cursor-grabbing"
              aria-label={text.list.move}
              title={text.list.moveHint}
            >
              <DotsSixVertical className="size-4" />
            </button>
            <div className="min-w-0 flex-1 py-2">{render(item)}</div>
          </li>
        ))}
      </ul>
      <span className="sr-only" role="status" {..._ui.attributes}>{announcement}</span>
    </>
  );
}

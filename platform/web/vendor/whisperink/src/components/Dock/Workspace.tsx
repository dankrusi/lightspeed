import { type ReactNode, useCallback, useEffect, useState } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import type { ToolbarDefinition, ToolbarEdge } from "../Toolbar/toolbar-types.js";
import { Toolbar } from "../Toolbar/Toolbar.js";
import type { PanelDefinition, WorkspaceLayout } from "./dock-layout.js";
import { Dock } from "./Dock.js";
import { accept, TOOLBAR_TYPE } from "./drag.js";

export type ToolbarPlacement = Record<string, ToolbarEdge>;

/**
 * Complete application frame: toolbar edges, three docks, a centre viewport,
 * and a status bar. Layout state is controlled by the caller so it can be
 * persisted or reset.
 * @category workspace
 */
export function Workspace({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  panels,
  layout,
  onLayoutChange,
  toolbars,
  placement,
  onPlacementChange,
  viewport,
  statusLeft,
  statusRight,
  className,
  style,
}: ({
  panels: Record<string, PanelDefinition>;
  layout: WorkspaceLayout;
  onLayoutChange: (updater: (layout: WorkspaceLayout) => WorkspaceLayout) => void;
  toolbars: ToolbarDefinition[];
  placement: ToolbarPlacement;
  onPlacementChange: (placement: ToolbarPlacement) => void;
  viewport: ReactNode;
  statusLeft?: ReactNode;
  statusRight?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) & UiMetadataProps) {
  const _ui = uiMetadata("workspace", "Arrange tools panels and content", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const [dragging, setDragging] = useState<{ kind: "panel" | "toolbar"; id: string } | null>(null);
  const onDragPanel = useCallback((id: string | null) => setDragging(id ? { kind: "panel", id } : null), []);
  useEffect(() => {
    const clear = () => setDragging(null);
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, []);
  const edge = (side: ToolbarEdge) => {
    const bars = toolbars.filter((toolbar) => placement[toolbar.id] === side);
    const vertical = side === "left" || side === "right";
    const active = dragging?.kind === "toolbar";
    if (bars.length === 0 && !active) return null;
    return (
      <div
        onDragOver={accept(TOOLBAR_TYPE)}
        onDrop={(event) => {
          const id = event.dataTransfer.getData(TOOLBAR_TYPE);
          if (!id) return;
          event.preventDefault();
          onPlacementChange({ ...placement, [id]: side });
          setDragging(null);
        }}
        className={cn(
          "flex shrink-0 gap-1.5 transition-colors",
          // Toolbars that do not fit one row take a second rather than being cut off at the edge.
          vertical ? "flex-col items-start" : "flex-row flex-wrap items-start",
          active && "bg-info-soft outline-dashed outline-1 -outline-offset-2 outline-info",
          bars.length === 0 && (vertical ? "min-w-10" : "min-h-10"),
        )}
      >
        {bars.map((toolbar) => (
          <Toolbar key={toolbar.id} toolbar={toolbar} edge={side} onDragStart={(id) => setDragging({ kind: "toolbar", id })} onDragEnd={() => setDragging(null)} onMove={(target) => onPlacementChange({ ...placement, [toolbar.id]: target })} />
        ))}
      </div>
    );
  };
  const dockProps = { panels, onChange: onLayoutChange, dragging, onDragPanel };
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-[rgb(var(--card-border-color))] bg-canvas text-fg shadow-card", className)} style={style} {..._ui.attributes}>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-1.5">
        {edge("top")}
        <div className="flex min-h-0 flex-1 gap-1.5">
          {edge("left")}
          {/* Docks and viewport read as one group: square towards each other, rounded and bordered towards the canvas – the same chrome a toolbar carries. */}
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[var(--card-radius)] border border-[rgb(var(--card-border-color))] bg-surface shadow-card">
            <Dock side="left" state={layout.docks.left} {...dockProps} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1 overflow-hidden">{viewport}</div>
              <Dock side="bottom" state={layout.docks.bottom} {...dockProps} />
            </div>
            <Dock side="right" state={layout.docks.right} {...dockProps} />
          </div>
          {edge("right")}
        </div>
        {edge("bottom")}
      </div>
      {(statusLeft || statusRight) && (
        <div className="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-3 text-2xs text-fg-muted">
          <span className="truncate">{statusLeft}</span>
          <span className="flex shrink-0 items-center gap-3">{statusRight}</span>
        </div>
      )}
    </div>
  );
}

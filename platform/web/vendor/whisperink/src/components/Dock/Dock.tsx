import { type DragEvent, useId, useRef } from "react";
import { cn } from "../../cn.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { closePanel, type DockSide, type DockState, movePanel, type PanelDefinition, type WorkspaceLayout } from "./dock-layout.js";
import { accept } from "./drag.js";
import { PanelHeader } from "./PanelHeader.js";

const PANEL_TYPE = "application/x-whisperink-panel";

function DockTabs({
  id,
  panels,
  active,
  side,
  onActivate,
  onClose,
  onDragStart,
  onDragEnd,
  onDrop,
  highlight,
}: {
  /** Prefix of the tab ids, which the panel below refers to. */
  id: string;
  panels: PanelDefinition[];
  active: string | null;
  side: DockSide;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (event: DragEvent) => void;
  highlight: boolean;
}) {
  const text = useText();
  return (
    <div
      role="tablist"
      onKeyDown={(event) => {
        const bar = event.currentTarget;
        if (event.key === "Delete" && active) {
          event.preventDefault();
          onClose(active);
          // The tab that had focus is gone; the one that took its place gets it.
          requestAnimationFrame(() => bar.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
          return;
        }
        const index = panels.findIndex((panel) => panel.id === active);
        const next =
          event.key === "ArrowRight" ? panels[(index + 1) % panels.length]
          : event.key === "ArrowLeft" ? panels[(index - 1 + panels.length) % panels.length]
          : event.key === "Home" ? panels[0]
          : event.key === "End" ? panels[panels.length - 1]
          : undefined;
        if (!next) return;
        event.preventDefault();
        onActivate(next.id);
        (bar.querySelector(`[data-panel="${next.id}"]`) as HTMLElement | null)?.focus();
      }}
      onDragOver={accept(PANEL_TYPE)}
      onDrop={onDrop}
      onWheel={(event) => { if (event.deltaY && !event.deltaX) event.currentTarget.scrollLeft += event.deltaY; }}
      className={cn("scrollbar-none flex h-9 shrink-0 items-end gap-0.5 overflow-x-auto overflow-y-hidden border-b border-border bg-subtle/60 px-1 transition-colors", highlight && "bg-info-soft")}
      aria-label={text.dock.side(side)}
    >
      {panels.map((panel) => {
        const selected = panel.id === active;
        return (
          <button
            key={panel.id}
            type="button"
            role="tab"
            id={`${id}-${panel.id}`}
            data-panel={panel.id}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            draggable
            onDragStart={(event) => { event.dataTransfer.setData(PANEL_TYPE, panel.id); event.dataTransfer.effectAllowed = "move"; onDragStart(panel.id); }}
            onDragEnd={onDragEnd}
            onClick={() => onActivate(panel.id)}
            onAuxClick={(event) => { if (event.button === 1) onClose(panel.id); }}
            title={text.dock.panelHint(panel.title)}
            {...uiMetadata("dock-tab", "Show one panel of the dock", panel).attributes}
            className={cn(
              "focus-ring -mb-px flex h-8 shrink-0 cursor-grab items-center gap-1.5 rounded-t border-b-[length:var(--tab-indicator-width)] px-2.5 text-sm transition-colors active:cursor-grabbing [&_svg]:size-3.5",
              selected ? "border-primary bg-surface font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {panel.icon}
            {panel.title}
          </button>
        );
      })}
      {panels.length === 0 && <span className="px-2 pb-2 text-xs text-fg-subtle">{text.dock.dropHint}</span>}
    </div>
  );
}

/** How small and how large a dock may be dragged; a bottom dock is a strip, a side dock a column. */
const dockLimits = (side: DockSide) => (side === "bottom" ? { min: 96, max: 640 } : { min: 180, max: 640 });

function Splitter({ side, size, onResize }: { side: DockSide; size: number; onResize: (delta: number) => void }) {
  const text = useText();
  const horizontal = side === "bottom";
  const last = useRef(0);
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    last.current = horizontal ? event.clientY : event.clientX;
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const current = horizontal ? event.clientY : event.clientX;
    const delta = current - last.current;
    last.current = current;
    onResize(side === "left" ? delta : -delta);
  };
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      aria-label={text.dock.resize}
      aria-valuenow={Math.round(size)}
      aria-valuemin={dockLimits(side).min}
      aria-valuemax={dockLimits(side).max}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 64 : 16;
        const grow = horizontal ? event.key === "ArrowUp" : side === "left" ? event.key === "ArrowRight" : event.key === "ArrowLeft";
        const shrink = horizontal ? event.key === "ArrowDown" : side === "left" ? event.key === "ArrowLeft" : event.key === "ArrowRight";
        if (grow || shrink) { event.preventDefault(); onResize(grow ? step : -step); }
      }}
      // The line stays four pixels; what can be grabbed reaches further, towards
      // the viewport only, so it never lies over the scrollbar of the panel.
      className={cn(
        "focus-ring relative z-10 shrink-0 touch-none bg-border transition-colors after:absolute after:content-[''] hover:bg-primary",
        horizontal ? "h-1 w-full cursor-row-resize after:inset-x-0 after:-top-1.5 after:bottom-0"
        : side === "left" ? "w-1 cursor-col-resize after:inset-y-0 after:-right-1.5 after:left-0"
        : "w-1 cursor-col-resize after:inset-y-0 after:-left-1.5 after:right-0",
      )}
      title={text.dock.resizeHint}
    />
  );
}

/**
 * A dock: tab bar, the active panel with its header, and a splitter towards the centre.
 * @category workspace
 */
export function Dock({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  side,
  state,
  panels,
  onChange,
  dragging,
  onDragPanel,
  className,
}: ({
  side: DockSide;
  state: DockState;
  panels: Record<string, PanelDefinition>;
  onChange: (updater: (layout: WorkspaceLayout) => WorkspaceLayout) => void;
  dragging: { kind: "panel" | "toolbar"; id: string } | null;
  onDragPanel: (id: string | null) => void;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("dock", "Arrange workspace panels", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const tabsId = useId();
  const visible = state.panels.map((id) => panels[id]).filter(Boolean);
  const activePanel = state.active ? panels[state.active] : undefined;
  const activate = (id: string) => onChange((layout) => ({ ...layout, docks: { ...layout.docks, [side]: { ...layout.docks[side], active: id } } }));
  const close = (id: string) => onChange((layout) => closePanel(layout, id));
  const move = (id: string, target: DockSide) => onChange((layout) => movePanel(layout, id, target));
  const drop = (event: DragEvent) => {
    const id = event.dataTransfer.getData(PANEL_TYPE);
    if (!id) return;
    event.preventDefault();
    move(id, side);
    onDragPanel(null);
  };
  const { min, max } = dockLimits(side);
  const resize = (delta: number) => onChange((layout) => ({ ...layout, docks: { ...layout.docks, [side]: { ...layout.docks[side], size: Math.max(min, Math.min(max, layout.docks[side].size + delta)) } } }));
  const highlight = dragging?.kind === "panel" && !state.panels.includes(dragging.id);
  if (visible.length === 0 && !highlight) return null;
  const horizontal = side === "bottom";
  return (
    <div
      className={cn("flex shrink-0", horizontal ? "w-full flex-col" : "h-full", side === "right" && "flex-row-reverse", side === "bottom" && "flex-col-reverse", className)}
      style={horizontal ? { height: state.size } : { width: state.size }} {..._ui.attributes}
    >
      <div
        className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-surface", highlight && "outline outline-2 -outline-offset-2 outline-info")}
        onDragOver={accept(PANEL_TYPE)}
        onDrop={drop}
      >
        <DockTabs id={tabsId} panels={visible} active={state.active} side={side} onActivate={activate} onClose={close} onDragStart={(id) => onDragPanel(id)} onDragEnd={() => onDragPanel(null)} onDrop={drop} highlight={Boolean(highlight)} />
        {activePanel && (
          <>
            <PanelHeader
              title={activePanel.title}
              icon={activePanel.icon}
              draggable
              onDragStart={(event) => { event.dataTransfer.setData(PANEL_TYPE, activePanel.id); event.dataTransfer.effectAllowed = "move"; onDragPanel(activePanel.id); }}
              onDragEnd={() => onDragPanel(null)}
              onMove={(target) => move(activePanel.id, target)}
              side={side}
              onHelp={activePanel.onHelp}
              helpActive={activePanel.helpActive}
              onClose={() => close(activePanel.id)}
            />
            <div role="tabpanel" aria-labelledby={`${tabsId}-${activePanel.id}`} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{activePanel.content}</div>
          </>
        )}
      </div>
      <Splitter side={side} size={state.size} onResize={resize} />
    </div>
  );
}

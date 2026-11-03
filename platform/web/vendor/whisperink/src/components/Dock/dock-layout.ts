import type { ReactNode } from "react";
import type { UiMetadataProps } from "../../metadata.js";

/*
 * Workspace primitives for "power" applications: docks with tabbed, movable
 * panels, toolbars that live on any edge (horizontal on top/bottom, vertical
 * on the sides), collapsible property sections, and property rows.
 * Drag and drop uses native HTML5 events; panels and toolbars are both
 * draggable by their grip handles.
 */

export type DockSide = "left" | "right" | "bottom";

/** A panel of a dock. Its metadata identifies the panel's tab. */
export type PanelDefinition = UiMetadataProps & {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  /** Handles the header's help button. Without one, the panel shows no help button. */
  onHelp?: () => void;
  /** Whether that help is currently on, so the button can say so. */
  helpActive?: boolean;
};
export type DockState = { panels: string[]; active: string | null; size: number };
export type WorkspaceLayout = { docks: Record<DockSide, DockState>; hidden: string[] };

/* ------------------------------------------------------------------ layout helpers */

export function closePanel(layout: WorkspaceLayout, id: string): WorkspaceLayout {
  const docks = { ...layout.docks };
  for (const side of Object.keys(docks) as DockSide[]) {
    const dock = docks[side];
    if (!dock.panels.includes(id)) continue;
    const panels = dock.panels.filter((panel) => panel !== id);
    docks[side] = { ...dock, panels, active: dock.active === id ? panels[Math.max(0, dock.panels.indexOf(id) - 1)] ?? panels[0] ?? null : dock.active };
  }
  return { docks, hidden: layout.hidden.includes(id) ? layout.hidden : [...layout.hidden, id] };
}

export function movePanel(layout: WorkspaceLayout, id: string, target: DockSide): WorkspaceLayout {
  const removed = closePanel(layout, id);
  const dock = removed.docks[target];
  return {
    hidden: removed.hidden.filter((panel) => panel !== id),
    docks: { ...removed.docks, [target]: { ...dock, panels: [...dock.panels, id], active: id } },
  };
}

export function openPanel(layout: WorkspaceLayout, id: string, preferred: DockSide): WorkspaceLayout {
  const existing = (Object.keys(layout.docks) as DockSide[]).find((side) => layout.docks[side].panels.includes(id));
  if (existing) return { ...layout, docks: { ...layout.docks, [existing]: { ...layout.docks[existing], active: id } } };
  return movePanel(layout, id, preferred);
}

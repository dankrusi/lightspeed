import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../../cn.js";
import { ArrowCounterClockwise, Layout } from "../../icons.js";
import { useText, type WhisperinkText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Badge } from "../Badge/Badge.js";
import { Button } from "../Button/Button.js";
import { type DockSide, openPanel, type PanelDefinition, type WorkspaceLayout } from "../Dock/dock-layout.js";
import { type ToolbarPlacement, Workspace } from "../Dock/Workspace.js";
import { Menu } from "../Menu/Menu.js";
import { MenuItem } from "../Menu/MenuItem.js";
import { MenuLabel } from "../Menu/MenuLabel.js";
import { useToast } from "../Toast/toast-context.js";
import type { ToolbarDefinition } from "../Toolbar/toolbar-types.js";

export type PowerAppProps = ({
  /** Panels available in the app, keyed by id; `initialLayout` decides where they start. */
  panels: Record<string, PanelDefinition>;
  toolbars: ToolbarDefinition[];
  initialLayout: WorkspaceLayout;
  initialPlacement: ToolbarPlacement;
  /** Centre area, typically a canvas or document view. */
  viewport: ReactNode;
  /** App bar: brand/title on the left, `menu` next to it, `actions` on the right. Omit `title` to hide the bar. */
  title?: ReactNode;
  menu?: ReactNode;
  actions?: ReactNode;
  /** Show the built-in panel menu, hidden-panel badge and layout reset. Disable when native menus provide these actions. */
  showLayoutControls?: boolean;
  statusLeft?: ReactNode;
  statusRight?: ReactNode;
  /** Dock side a re-opened panel goes to. */
  reopenSide?: DockSide;
  /** Persist layout and toolbar placement in localStorage under this key. */
  storageKey?: string;
  /** Labels of the built-in panel menu and reset action. */
  labels?: Partial<WhisperinkText["powerApp"]>;
  /** Controlled mode: pass both to own the state (e.g. persist it server-side). */
  layout?: WorkspaceLayout;
  onLayoutChange?: (layout: WorkspaceLayout) => void;
  placement?: ToolbarPlacement;
  onPlacementChange?: (placement: ToolbarPlacement) => void;
  className?: string;
  style?: CSSProperties;
}) & UiMetadataProps;

type Persisted = { layout: WorkspaceLayout; placement: ToolbarPlacement };

function readPersisted(key: string | undefined, panels: Record<string, PanelDefinition>, toolbars: ToolbarDefinition[]): Persisted | null {
  if (!key || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    const sides: DockSide[] = ["left", "right", "bottom"];
    const known = (id: string) => id in panels;
    const docks = Object.fromEntries(sides.map((side) => {
      const dock = parsed.layout?.docks?.[side];
      const list = (dock?.panels ?? []).filter(known);
      return [side, { panels: list, active: dock?.active && list.includes(dock.active) ? dock.active : list[0] ?? null, size: Number(dock?.size) || 280 }];
    })) as WorkspaceLayout["docks"];
    const placed = new Set(sides.flatMap((side) => docks[side].panels));
    const hidden = Object.keys(panels).filter((id) => !placed.has(id));
    const placement = Object.fromEntries(toolbars.map((toolbar) => [toolbar.id, parsed.placement?.[toolbar.id] ?? "top"])) as ToolbarPlacement;
    return { layout: { docks, hidden }, placement };
  } catch {
    return null;
  }
}

/**
 * Ready-to-use frame for tool-style applications: app bar with panel menu and
 * layout reset, toolbars on any edge, three docks, viewport and status bar.
 * Owns its layout state (optionally persisted) unless `layout`/`placement`
 * are passed, in which case it is fully controlled.
 * @category shell
 */
export function PowerApp({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  panels,
  toolbars,
  initialLayout,
  initialPlacement,
  viewport,
  title,
  menu,
  actions,
  showLayoutControls = true,
  statusLeft,
  statusRight,
  reopenSide = "right",
  storageKey,
  labels: labelOverrides,
  layout: controlledLayout,
  onLayoutChange,
  placement: controlledPlacement,
  onPlacementChange,
  className,
  style,
}: (PowerAppProps) & UiMetadataProps) {
  const _ui = uiMetadata("power-app", "Frame a tool application", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const toast = useToast();
  const labels = { ...text.powerApp, ...labelOverrides };
  const [state, setState] = useState<Persisted>(() => readPersisted(storageKey, panels, toolbars) ?? { layout: initialLayout, placement: initialPlacement });
  const layout = controlledLayout ?? state.layout;
  const placement = controlledPlacement ?? state.placement;

  useEffect(() => {
    if (!storageKey || typeof localStorage === "undefined") return;
    try { localStorage.setItem(storageKey, JSON.stringify({ layout, placement })); } catch { /* storage unavailable */ }
  }, [storageKey, layout, placement]);

  const updateLayout = useCallback((updater: (current: WorkspaceLayout) => WorkspaceLayout) => {
    if (controlledLayout) { onLayoutChange?.(updater(controlledLayout)); return; }
    setState((current) => {
      const next = updater(current.layout);
      onLayoutChange?.(next);
      return { ...current, layout: next };
    });
  }, [controlledLayout, onLayoutChange]);
  const updatePlacement = useCallback((next: ToolbarPlacement) => {
    if (!controlledPlacement) setState((current) => ({ ...current, placement: next }));
    onPlacementChange?.(next);
  }, [controlledPlacement, onPlacementChange]);
  // One press throws away an arrangement that took a while to make, so it
  // comes with the way back. Without a toast outlet the reset is what it was.
  const reset = () => {
    const before = { layout, placement };
    updateLayout(() => initialLayout);
    updatePlacement(initialPlacement);
    toast({
      title: labels.layoutReset,
      action: { label: text.actions.undo, onClick: () => { updateLayout(() => before.layout); updatePlacement(before.placement); } },
    });
  };

  const visible = useMemo(() => Object.values(panels).filter((panel) => !layout.hidden.includes(panel.id)), [panels, layout.hidden]);
  const hidden = useMemo(() => layout.hidden.map((id) => panels[id]).filter((panel) => panel !== undefined), [panels, layout.hidden]);

  const bar = title !== undefined && (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-2">
      <div className="flex min-w-0 items-center gap-2 px-1 text-sm font-semibold">{title}</div>
      {menu && <div className="flex items-center gap-1">{menu}</div>}
      <div className="ml-auto flex items-center gap-1.5">
        {showLayoutControls && <>
        {hidden.length > 0 && <Badge tone="info" dot>{labels.closedPanels(hidden.length)}</Badge>}
        <Menu
          align="end"
          trigger={({ toggle, open }) => <Button variant="ghost" size="sm" onClick={toggle} aria-haspopup="menu" aria-expanded={open}><Layout />{labels.panels}</Button>}
        >
          <MenuLabel>{labels.visible}</MenuLabel>
          {visible.map((panel) => (
            <MenuItem key={panel.id} icon={panel.icon} onClick={() => updateLayout((current) => openPanel(current, panel.id, reopenSide))}>{panel.title}</MenuItem>
          ))}
          {hidden.length > 0 && <MenuLabel>{labels.closed}</MenuLabel>}
          {hidden.map((panel) => (
            <MenuItem key={panel.id} icon={panel.icon} onClick={() => updateLayout((current) => openPanel(current, panel.id, reopenSide))}>{labels.show(panel.title)}</MenuItem>
          ))}
        </Menu>
        <Button variant="ghost" size="sm" onClick={reset}><ArrowCounterClockwise />{labels.resetLayout}</Button>
        </>}
        {actions}
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-[rgb(var(--card-border-color))] bg-surface text-fg shadow-card", className)} style={style} {..._ui.attributes}>
      {bar}
      <Workspace
        panels={panels}
        layout={layout}
        onLayoutChange={updateLayout}
        toolbars={toolbars}
        placement={placement}
        onPlacementChange={updatePlacement}
        viewport={viewport}
        statusLeft={statusLeft}
        statusRight={statusRight}
        className="min-h-0 flex-1 rounded-none border-0 shadow-none"
      />
    </div>
  );
}

import { useCallback, useMemo, useState, type ComponentProps, type Ref } from "react";
import { cn } from "../../cn.js";
import { OverlayRegionContext } from "../../floating.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Confines the overlays inside it to itself instead of the window. Menus,
 * popovers and tooltips open against its edges, dialogs cover it and leave the
 * rest of the page usable, and a `ToastProvider` inside it shows toasts in its
 * corner. For a dialog that belongs to one pane of a tool, an embedded preview
 * or documentation. An overlay that is open when it mounts here is on display:
 * it takes no focus and traps no keys until someone uses it. The region clips
 * what does not fit, so give it the room its overlays need.
 * @category overlays
 */
export function OverlayRegion({ uiId, uiDescription, uiComponentId, uiComponentDescription, className, children, ref, ...props }: ComponentProps<"div"> & UiMetadataProps) {
  const _ui = uiMetadata("overlay-region", "Confine overlays to a page region", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const attach = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  }, [ref]) as Ref<HTMLDivElement>;
  const value = useMemo(() => ({ element }), [element]);
  return (
    // `contain: layout` makes the region the containing block of its fixed-position overlays, `paint` clips them to it.
    <div ref={attach} className={cn("relative isolate [contain:layout_paint]", className)} {...props} {..._ui.attributes}>
      <OverlayRegionContext.Provider value={value}>{children}</OverlayRegionContext.Provider>
    </div>
  );
}

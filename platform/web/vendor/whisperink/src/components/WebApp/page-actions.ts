import { createContext, type ReactNode, useContext, useEffect, useId } from "react";
import type { UiMetadataProps } from "../../metadata.js";

/* ------------------------------------------------------------------ page actions */

/**
 * A global page function (save, delete, export, …). Every page action lives in
 * the app bar, left of search/notifications/profile – never inline in the page.
 */
export type PageAction = UiMetadataProps & {
  id: string;
  label: string;
  icon?: ReactNode;
  /** `primary` renders filled; `secondary` (default) renders outlined or in the overflow menu. */
  kind?: "primary" | "secondary";
  /** Higher priority is shown first; lower priorities are the first to collapse into the overflow menu. Default 0. */
  priority?: number;
  onClick?: () => void;
  /** Renders the action as a link, so it keeps middle-click and "open in new tab". */
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Destructive action: red in the overflow menu and as a visible secondary. */
  danger?: boolean;
  shortcut?: string;
};

/* ------------------------------------------------------------------ registration from inside pages */

export type Registry = { register: (owner: string, actions: readonly PageAction[]) => void; unregister: (owner: string) => void };
export const PageActionsContext = createContext<Registry | null>(null);

/**
 * Registers the page's global actions with the surrounding `WebApp` from
 * anywhere in the page tree (e.g. a routed screen). Actions are removed on unmount.
 */
export function usePageActions(actions: readonly PageAction[]) {
  const registry = useContext(PageActionsContext);
  const owner = useId();
  useEffect(() => {
    if (!registry) return;
    registry.register(owner, actions);
    return () => registry.unregister(owner);
  }, [registry, owner, actions]);
}

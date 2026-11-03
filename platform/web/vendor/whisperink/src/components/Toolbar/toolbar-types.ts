import type { ReactNode } from "react";
import type { UiMetadataProps } from "../../metadata.js";

export type ToolbarEdge = "top" | "left" | "right" | "bottom";

/**
 * One of the alternatives a tool can be switched to, listed under its caret.
 *
 * A toolbar has room for a handful of buttons and an application can have any
 * number of things to switch between, so a tool that stands for a choice shows
 * the choice it is on and keeps the rest here. The list scrolls, because how
 * long it is belongs to the document rather than to the toolbar.
 */
/** An entry of a tool's menu. Its metadata goes on to the menu item. */
export type ToolMenuEntry = UiMetadataProps & { id: string; label: string; icon?: ReactNode; active?: boolean; disabled?: boolean; onClick: () => void };
/** One tool. Its metadata identifies the tool button, as `uiId` does a component. */
export type ToolItem = UiMetadataProps & {
  id: string; icon: ReactNode; label: string; active?: boolean; disabled?: boolean; onClick?: () => void; showLabel?: boolean;
  /** Alternatives, shown under a caret joined to the button itself. */
  menu?: readonly ToolMenuEntry[];
  /** Accessible name of that caret, e.g. "Choose a camera". */
  menuLabel?: string;
};
export type ToolbarGroupDefinition = { id: string; items: ToolItem[] };
export type ToolbarDefinition = { id: string; /** Accessible name of the toolbar; the id stands in when there is none. */ label?: string; groups: ToolbarGroupDefinition[] };

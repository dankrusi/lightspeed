import type { DragEvent } from "react";

export const TOOLBAR_TYPE = "application/x-whisperink-toolbar";

/**
 * Accept a drag of one of our own types.
 *
 * `dropEffect` has to be named explicitly: a host that leaves it at its default
 * refuses the drop and shows a no-drop cursor, even though `dragover` was
 * cancelled.
 */
export const accept = (type: string) => (event: DragEvent<HTMLElement>) => {
  if (!event.dataTransfer.types.includes(type)) return;
  event.dataTransfer.dropEffect = "move";
  event.preventDefault();
};

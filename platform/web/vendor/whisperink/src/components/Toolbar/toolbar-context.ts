import { createContext } from "react";

/**
 * A toolbar is one Tab stop: Tab enters it at the tool last used and leaves it
 * again, and the arrow keys move between its tools. The toolbar holds which
 * tool that is; a `ToolButton` outside a toolbar has no such context and stays
 * an ordinary button.
 */
export const ToolbarRovingContext = createContext<{ current: string | null; setCurrent: (id: string) => void } | null>(null);

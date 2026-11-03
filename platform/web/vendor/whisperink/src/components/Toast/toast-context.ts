import { createContext, useContext } from "react";
import type { Tone } from "../../tone.js";

export type ToastOptions = {
  /** Defaults to neutral. */
  tone?: Tone;
  title: string;
  description?: string;
  /** One follow-up, typically undoing what the toast reports. Choosing it closes the toast. */
  action?: { label: string; onClick: () => void };
  /**
   * Milliseconds before it goes on its own; `null` keeps it until dismissed.
   * By default a toast stays longer the more it asks of the reader: five
   * seconds, eight for a warning, ten for an error, and three more with an action.
   */
  duration?: number | null;
};
export type Toast = ToastOptions & { id: number };

export const ToastContext = createContext<(toast: ToastOptions) => () => void>(() => () => undefined);

/** Shows a toast; the function it returns takes that toast away again. */
export function useToast() {
  return useContext(ToastContext);
}

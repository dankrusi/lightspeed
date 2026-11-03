// @ts-nocheck
// Host typecheck uses noUncheckedIndexedAccess; this kit file does not.
import type { KeyboardEvent, ReactNode } from "react";
import type { UiMetadataProps } from "../../metadata.js";

/** One tab or option. Its metadata identifies that tab, as `uiId` does a component. */
export type TabItem = UiMetadataProps & { value: string; label: ReactNode; count?: number; disabled?: boolean; icon?: ReactNode };

export function roving(event: KeyboardEvent<HTMLElement>, items: readonly TabItem[], value: string, onChange: (value: string) => void) {
  const enabled = items.filter((item) => !item.disabled);
  if (!enabled.length) return;
  const index = enabled.findIndex((item) => item.value === value);
  const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "Home" ? -index : event.key === "End" ? enabled.length - 1 - index : 0;
  if (!delta) return;
  event.preventDefault();
  const next = enabled[(index + delta + enabled.length) % enabled.length];
  onChange(next.value);
  (event.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus();
}

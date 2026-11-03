import { useRef, useState } from "react";
import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/** A number, not a field someone has only started: "", "-" and "." are not one. */
const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!NUMBER.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * A number you can actually type into.
 *
 * A field written straight back from the value it shows fights whoever is
 * typing: "0.1" passes through "0", which the owner clamps and reformats, and
 * every keystroke after that lands in a field that has already been rewritten,
 * so the value sticks. While this one has focus it shows what was typed and
 * nothing else; the owner hears about it as soon as the text reads as a whole
 * number, and again on the way out.
 *
 * It is a text field rather than a number one because a browser reports a
 * half-typed number such as "0." as an empty value, which loses the keystroke
 * just the same. Arrow keys still step, with Shift for ten times the step and
 * Alt for a tenth of it.
 * @category forms
 */
export function NumberInput({ uiId, uiDescription, uiComponentId, uiComponentDescription, value, onChange, min, max, step = 1, decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0, disabled, label, className }: ({
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Places shown while the field is not being edited. Derived from the step by default. */
  decimals?: number;
  disabled?: boolean;
  /** Announced to a screen reader, for a field whose visible label sits beside it. */
  label?: string;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("number-input", "Edit a numeric value", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const [draft, setDraft] = useState<string | null>(null);
  /** What to put back when an edit is abandoned. */
  const entered = useRef(value);
  const abandoned = useRef(false);
  // A typed number is only held to the range. Rounding it to what the field
  // shows would quietly refuse a third decimal the value is perfectly happy to
  // hold, so only stepping rounds, and only to undo its own arithmetic.
  const bound = (next: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));
  const stepTo = (next: number) => Number(bound(next).toFixed(Math.min(10, Math.max(decimals, 0))));
  const commit = (text: string) => {
    const parsed = parseNumber(text);
    if (parsed !== null) onChange(bound(parsed));
    setDraft(null);
  };
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={draft ?? (Number.isInteger(step) ? String(value) : value.toFixed(decimals))}
      disabled={disabled}
      // Editing starts from the value itself rather than its rounded display, so
      // opening a field and leaving it cannot quietly round what it held.
      onFocus={() => { entered.current = value; setDraft(String(value)); }}
      onChange={(event) => {
        // Only what someone is typing becomes a draft. A value written in from
        // elsewhere must leave the field showing the value, not a stale draft.
        setDraft(document.activeElement === event.target ? event.target.value : null);
        const parsed = parseNumber(event.target.value);
        if (parsed !== null) onChange(bound(parsed));
      }}
      onBlur={(event) => {
        // Only an edit is committed. Leaving a field alone must not write its
        // rounded display back over the value it was showing.
        if (draft !== null && !abandoned.current) commit(event.target.value);
        abandoned.current = false;
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") { commit(event.currentTarget.value); event.currentTarget.blur(); return; }
        if (event.key === "Escape") {
          // Nothing typed yet, so there is nothing to abandon and the Escape
          // belongs to whatever is around the field, such as a dialog.
          if (draft === null || draft === String(entered.current)) return;
          // The value has been following the typing, so abandoning means putting
          // back what was there on the way in. An overlay listening for Escape
          // must not also take this one and close.
          event.stopPropagation();
          abandoned.current = true;
          setDraft(null);
          onChange(entered.current);
          event.currentTarget.blur();
          return;
        }
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        const size = step * (event.shiftKey ? 10 : event.altKey ? 0.1 : 1);
        const from = parseNumber(event.currentTarget.value) ?? value;
        const stepped = stepTo(from + (event.key === "ArrowUp" ? size : -size));
        setDraft(null);
        onChange(stepped);
      }}
      className={cn("control h-7 text-right text-xs tabular-nums", className)} {..._ui.attributes}
    />
  );
}

import { useEffect, useState } from "react";
import { Field } from "@versavolta/whisperink/components/Field/Field.js";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";

const DAY_MS = 86_400_000;
const MAX_DELETE_AFTER_CLOSE_MS = 100 * 365 * DAY_MS;

export function retentionDaysValue(value: string): {
  deleteAfterCloseMs: number | undefined;
  error: string | null;
} {
  if (!value.trim()) return { deleteAfterCloseMs: undefined, error: null };
  const days = Number(value);
  const milliseconds = Math.round(days * DAY_MS);
  if (!Number.isFinite(days) || days <= 0 || milliseconds < 1) {
    return { deleteAfterCloseMs: undefined, error: "Enter a positive number of days." };
  }
  if (milliseconds > MAX_DELETE_AFTER_CLOSE_MS) {
    return { deleteAfterCloseMs: undefined, error: "Retention cannot exceed 100 years." };
  }
  return { deleteAfterCloseMs: milliseconds, error: null };
}

export function ProfileRetentionEditor({
  value,
  disabled,
  onChange,
  onValidityChange,
}: {
  value?: number;
  disabled?: boolean;
  onChange: (deleteAfterCloseMs: number | undefined) => void;
  onValidityChange?: (message: string | null) => void;
}) {
  const valueSource = value === undefined ? "" : String(value / DAY_MS);
  const [days, setDays] = useState(valueSource);
  const [syncedSource, setSyncedSource] = useState(valueSource);
  const parsed = retentionDaysValue(days);

  useEffect(() => {
    if (valueSource !== syncedSource) {
      setDays(valueSource);
      setSyncedSource(valueSource);
    }
  }, [syncedSource, valueSource]);

  useEffect(() => {
    onValidityChange?.(parsed.error);
  }, [onValidityChange, parsed.error]);

  return (
    <Field
      className="max-w-full sm:max-w-sm"
      label="Delete after close (days)"
      hint="Starts when the root session closes and deletes its retained forks and sub-agents too. Leave blank to keep them."
      error={parsed.error ?? undefined}
    >
      {(field) => (
        <Input
          {...field.control}
          type="number"
          min={1 / DAY_MS}
          max={100 * 365}
          step="any"
          value={days}
          disabled={disabled}
          placeholder="Keep until manually deleted"
          onChange={(event) => {
            const next = event.target.value;
            const result = retentionDaysValue(next);
            setDays(next);
            if (!result.error) onChange(result.deleteAfterCloseMs);
          }}
        />
      )}
    </Field>
  );
}

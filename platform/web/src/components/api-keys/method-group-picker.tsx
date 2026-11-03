import { useId } from "react";
import type { MethodGroup } from "@lightspeed-ai/sdk";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { Checkbox } from "@versavolta/whisperink/components/Checkbox/Checkbox.js";
import { METHOD_GROUPS, presetFor, UNIVERSE_KEY_PRESETS } from "@/lib/method-groups";

/** Preset starting points for a universe key's groups; ticking a box makes it custom. */
export function KeyPresetField({
  groups,
  onChange,
}: {
  groups: ReadonlySet<MethodGroup>;
  onChange: (next: Set<MethodGroup>) => void;
}) {
  const preset = presetFor(groups);
  const id = useId();
  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} className="grid gap-1.5">
      <span id={`${id}-label`} className="text-sm font-medium text-fg">Start from</span>
      <div className="flex flex-wrap gap-2">
        {UNIVERSE_KEY_PRESETS.map((candidate) => (
          <Button
            key={candidate.id}
            type="button"
            size="sm"
            variant={preset?.id === candidate.id ? "secondary" : "outline"}
            aria-pressed={preset?.id === candidate.id}
            onClick={() => onChange(new Set(candidate.groups))}
          >
            {candidate.label}
          </Button>
        ))}
      </div>
      <p id={`${id}-hint`} className="text-xs text-fg-muted">
        {preset?.description ?? "Custom: only the groups ticked below."}
      </p>
    </div>
  );
}

/** The method groups a new key may call, with each chosen group's caution. */
export function MethodGroupPicker({
  idPrefix,
  allowed,
  chosen,
  onChange,
}: {
  idPrefix: string;
  allowed: MethodGroup[];
  chosen: ReadonlySet<MethodGroup>;
  onChange: (next: Set<MethodGroup>) => void;
}) {
  const toggle = (group: MethodGroup, on: boolean) => {
    const next = new Set(chosen);
    if (on) next.add(group);
    else next.delete(group);
    onChange(next);
  };
  const cautions = allowed.filter((group) => chosen.has(group) && METHOD_GROUPS[group].caution);
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">May call</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {allowed.map((group) => (
          <Checkbox
            key={group}
            id={`${idPrefix}-group-${group}`}
            label={<span className="text-sm">{METHOD_GROUPS[group].label}</span>}
            checked={chosen.has(group)}
            onChange={(event) => toggle(group, event.target.checked)}
          />
        ))}
      </div>
      {cautions.length > 0 && (
        <ul className="mt-1 grid gap-1 text-xs text-amber-700 dark:text-amber-400">
          {cautions.map((group) => (
            <li key={group}>
              <span className="font-medium">{METHOD_GROUPS[group].label}:</span> {METHOD_GROUPS[group].caution}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

/** A key's groups in a table cell: wraps to two lines at most, the full list on hover. */
export function GroupSummary({ summary }: { summary: string }) {
  return (
    <span title={summary} className="line-clamp-2 max-w-72 min-w-48 whitespace-normal">
      {summary}
    </span>
  );
}

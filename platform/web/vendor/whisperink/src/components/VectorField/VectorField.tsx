import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { NumberInput } from "../NumberInput/NumberInput.js";

/**
 * X/Y/Z triple input.
 * @category workspace
 */
export function VectorField({ uiId, uiDescription, uiComponentId, uiComponentDescription, value, onChange, labels = ["X", "Y", "Z"], step = 0.01 }: ({ value: number[]; onChange: (value: number[]) => void; labels?: string[]; step?: number }) & UiMetadataProps) {
  const _ui = uiMetadata("vector-field", "Edit vector coordinates", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <div className="grid grid-cols-3 gap-1.5" {..._ui.attributes}>
      {value.map((component, index) => (
        <label key={labels[index]} className="relative block">
          <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-2xs font-semibold text-fg-subtle">{labels[index]}</span>
          <NumberInput
            value={component}
            onChange={(next) => onChange(value.map((current, position) => (position === index ? next : current)))}
            step={step}
            label={labels[index]}
            className="w-full pl-5 pr-1"
          />
        </label>
      ))}
    </div>
  );
}

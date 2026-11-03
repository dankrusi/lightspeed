import { cn } from "../../cn.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { NumberInput } from "../NumberInput/NumberInput.js";

/**
 * Slider with a numeric input and unit; the typical parameter control of a 3D or CAD tool.
 * @category workspace
 */
export function SliderField({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  disabled,
  decimals = 2,
  label,
}: ({
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  decimals?: number;
  /** Announced to a screen reader, for a row whose visible label sits beside it. */
  label?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("slider-field", "Adjust a value along a range", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min) || 0));
  return (
    <div className={cn("flex items-center gap-2", disabled && "opacity-50")} {..._ui.attributes}>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="wi-range min-w-0 flex-1"
        style={{ "--ratio": ratio } as React.CSSProperties}
      />
      <NumberInput
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        decimals={decimals}
        disabled={disabled}
        label={label}
        className="w-[72px] px-1.5"
      />
      {unit && <span className="w-6 shrink-0 text-2xs text-fg-subtle">{unit}</span>}
    </div>
  );
}

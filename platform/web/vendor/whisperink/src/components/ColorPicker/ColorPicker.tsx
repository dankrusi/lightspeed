import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { Check } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Input } from "../Input/Input.js";
import { SearchInput } from "../Input/SearchInput.js";
import { NumberInput } from "../NumberInput/NumberInput.js";
import { Popover } from "../Popover/Popover.js";
import { Segmented } from "../Tabs/Segmented.js";

/** One named colour in an optional product or industry palette. */
export type ColorSwatch = {
  /** Stable palette identity, such as a standard's catalogue code. */
  id: string;
  /** Six-digit sRGB display value. */
  value: string;
  /** Human-readable code and name. */
  label: string;
  /** Extra terms included in palette search without being rendered. */
  keywords?: string;
};

/** A named set of colours offered beside free colour adjustment. */
export type ColorPalette = {
  /** Stable identity when several palettes are shown together. */
  id?: string;
  label: string;
  swatches: readonly ColorSwatch[];
};

type Rgb = { r: number; g: number; b: number };
type Hsv = { h: number; s: number; v: number };

const HEX = /^#?([\da-f]{6}|[\da-f]{3})$/i;

/** Canonicalise the forms accepted by the editable HEX field. */
function normalizeHex(value: string, fallback = "#000000"): string {
  const match = HEX.exec(value.trim());
  if (!match) return fallback;
  const digits = match[1].length === 3 ? [...match[1]].map(part => part + part).join("") : match[1];
  return `#${digits.toLowerCase()}`;
}

function hexToRgb(value: string): Rgb {
  const hex = normalizeHex(value).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const channels = [r, g, b].map(value => value / 255);
  const maximum = Math.max(...channels), minimum = Math.min(...channels), distance = maximum - minimum;
  let hue = 0;
  if (distance) {
    if (maximum === channels[0]) hue = ((channels[1] - channels[2]) / distance) % 6;
    else if (maximum === channels[1]) hue = (channels[2] - channels[0]) / distance + 2;
    else hue = (channels[0] - channels[1]) / distance + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { h: hue, s: maximum ? distance / maximum * 100 : 0, v: maximum * 100 };
}

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const saturation = Math.min(100, Math.max(0, s)) / 100;
  const value = Math.min(100, Math.max(0, v)) / 100;
  const chroma = value * saturation;
  const part = hue / 60;
  const x = chroma * (1 - Math.abs(part % 2 - 1));
  const candidates: readonly (readonly [number, number, number])[] = [
    [chroma, x, 0], [x, chroma, 0], [0, chroma, x],
    [0, x, chroma], [x, 0, chroma], [chroma, 0, x],
  ];
  const [red, green, blue] = candidates[Math.min(5, Math.floor(part))];
  const match = value - chroma;
  return { r: (red + match) * 255, g: (green + match) * 255, b: (blue + match) * 255 };
}

function hsvToHex(value: Hsv): string {
  return rgbToHex(hsvToRgb(value));
}

/** A HEX field that tolerates an in-progress edit and commits only a complete colour. */
function HexInput({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const entered = useRef(value);
  const commit = (candidate: string) => {
    if (HEX.test(candidate.trim())) onChange(normalizeHex(candidate, value));
    setDraft(null);
  };
  return (
    <Input
      size="sm"
      aria-label={label}
      spellCheck={false}
      value={draft ?? value.toUpperCase()}
      className="font-mono text-xs tabular-nums"
      onFocus={() => { entered.current = value; setDraft(value.toUpperCase()); }}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        if (HEX.test(next.trim())) onChange(normalizeHex(next, value));
      }}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") { commit(event.currentTarget.value); event.currentTarget.blur(); }
        if (event.key !== "Escape" || draft === null) return;
        event.stopPropagation();
        setDraft(null);
        onChange(entered.current);
        event.currentTarget.blur();
      }}
    />
  );
}

/** A compact labelled numeric channel used for RGB and HSB precision entry. */
function Channel({ label, name, value, max, onChange }: {
  label: string;
  name: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label title={name} className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-1.5 text-xs text-fg-muted">
      <span>{label}</span>
      <NumberInput value={value} onChange={onChange} min={0} max={max} decimals={0} label={name} className="min-w-0 px-1.5" />
    </label>
  );
}

/**
 * Professional sRGB colour picker with visual SV and hue controls, exact
 * HEX/RGB/HSB entry, and an optional searchable named palette.
 *
 * The selected swatch is passed with `onChange`; free adjustments omit it so a
 * host can preserve or clear catalogue provenance without coupling the kit to
 * one particular standard.
 * @category forms
 */
export function ColorPicker({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  value,
  onChange,
  label,
  disabled,
  palette,
  palettes,
  selectedSwatch,
  defaultOpen = false,
  className,
}: ({
  value: string;
  onChange: (value: string, swatch?: ColorSwatch) => void;
  label: string;
  disabled?: boolean;
  /** One named palette, retained for backwards compatibility. */
  palette?: ColorPalette;
  /** Several named palettes shown as separate views beside Adjust. */
  palettes?: readonly ColorPalette[];
  selectedSwatch?: string;
  /** Opens the picker on mount, for documentation; see `Popover`. */
  defaultOpen?: boolean;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("color-picker", "Choose a color", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText().colorPicker;
  const availablePalettes = palettes?.length ? palettes : palette ? [palette] : [];
  const safeValue = normalizeHex(value);
  const rgb = hexToRgb(safeValue);
  const calculated = rgbToHsv(rgb);
  // Greys carry no hue in RGB. Remember the last useful one so changing hue
  // while saturation is zero still chooses where saturation will return.
  const [rememberedHue, setRememberedHue] = useState(calculated.h);
  useEffect(() => { if (calculated.s > 0) setRememberedHue(calculated.h); }, [calculated.h, calculated.s]);
  const hsv = { ...calculated, h: calculated.s > 0 ? calculated.h : rememberedHue };
  // A colour chosen from a palette opens on that palette, where it is marked.
  const [view, setView] = useState(() => {
    const index = availablePalettes.findIndex(entry => entry.swatches.some(swatch => swatch.id === selectedSwatch));
    return selectedSwatch !== undefined && index >= 0 ? `palette:${index}` : "adjust";
  });
  const [model, setModel] = useState<"rgb" | "hsb">("hsb");
  const [query, setQuery] = useState("");
  const selected = availablePalettes.flatMap(entry => entry.swatches).find(swatch => swatch.id === selectedSwatch);
  const paletteIndex = view.startsWith("palette:") ? Number(view.slice("palette:".length)) : -1;
  const activePalette = availablePalettes[paletteIndex];
  const emitHsv = (next: Hsv) => {
    setRememberedHue(next.h);
    onChange(hsvToHex(next));
  };
  const filtered = activePalette?.swatches.filter(swatch => {
    const needle = query.trim().toLocaleLowerCase();
    return !needle || `${swatch.id} ${swatch.label} ${swatch.keywords ?? ""}`.toLocaleLowerCase().includes(needle);
  }) ?? [];

  const point = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const saturation = (event.clientX - bounds.left) / bounds.width * 100;
    const brightness = (bounds.bottom - event.clientY) / bounds.height * 100;
    emitHsv({ h: hsv.h, s: Math.min(100, Math.max(0, saturation)), v: Math.min(100, Math.max(0, brightness)) });
  };
  const movePoint = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    emitHsv({
      h: hsv.h,
      s: Math.min(100, Math.max(0, hsv.s + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0))),
      v: Math.min(100, Math.max(0, hsv.v + (event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0))),
    });
  };

  return (
    <Popover
      defaultOpen={defaultOpen}
      rootClassName="w-full"
      align="end"
      className="w-72 max-w-[calc(100vw-1rem)] p-2"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          aria-label={text.edit(label)}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onClick={toggle}
          title={selected ? `${selected.label} (${safeValue.toUpperCase()})` : safeValue.toUpperCase()}
          className={cn(
            "control focus-ring flex h-8 w-full items-center gap-2 px-1.5 text-left text-xs disabled:opacity-50",
            className,
          )}
        >
          <span className="size-5 shrink-0 rounded border border-border-strong" style={{ backgroundColor: safeValue }} />
          <span className="min-w-0 flex-1 truncate">{selected?.label ?? safeValue.toUpperCase()}</span>
        </button>
      )} {..._ui.props}
    >
      <div role="dialog" aria-label={text.edit(label)} className="grid gap-2.5">
        {availablePalettes.length > 0 && (
          <Segmented
            size="sm"
            className="w-full [&>button]:flex-1"
            label={text.views}
            value={view}
            onChange={setView}
            items={[
              { value: "adjust", label: text.adjust },
              ...availablePalettes.map((entry, index) => ({
                value: `palette:${index}`,
                label: entry.label,
              })),
            ]}
          />
        )}

        {view === "adjust" || !activePalette ? (
          <>
            <button
              type="button"
              className="focus-ring relative h-36 w-full touch-none overflow-hidden rounded-[var(--control-radius)] border border-border-strong"
              style={{
                backgroundColor: `hsl(${hsv.h} 100% 50%)`,
                backgroundImage: "linear-gradient(to top, rgb(0 0 0), transparent), linear-gradient(to right, rgb(255 255 255), transparent)",
              }}
              aria-label={text.saturationBrightness}
              aria-valuetext={text.saturationBrightnessValue(Math.round(hsv.s), Math.round(hsv.v))}
              onKeyDown={movePoint}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); point(event); }}
              onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) point(event); }}
              onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface shadow-md ring-1 ring-fg/70"
                style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: safeValue }}
              />
            </button>

            <label className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs text-fg-muted">
              <span>{text.hue}</span>
              <input
                type="range"
                className="wi-hue-range min-w-0"
                min={0}
                max={359}
                step={1}
                value={Math.round(hsv.h) % 360}
                aria-label={text.hue}
                onChange={event => emitHsv({ ...hsv, h: Number(event.target.value) })}
              />
              <span className="w-8 text-right tabular-nums">{Math.round(hsv.h) % 360}°</span>
            </label>

            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <label className="grid gap-1 text-xs text-fg-muted">
                <span>{text.hex}</span>
                <HexInput value={safeValue} label={text.hex} onChange={next => onChange(next)} />
              </label>
              <Segmented
                size="sm"
                label={text.colorModel}
                value={model}
                onChange={next => setModel(next as "rgb" | "hsb")}
                items={[{ value: "hsb", label: text.hsb }, { value: "rgb", label: text.rgb }]}
              />
            </div>

            <div className="grid grid-cols-3 gap-2" aria-label={model === "rgb" ? text.rgb : text.hsb}>
              {model === "rgb" ? (
                <>
                  <Channel label={text.redShort} name={text.red} value={rgb.r} max={255} onChange={r => onChange(rgbToHex({ ...rgb, r }))} />
                  <Channel label={text.greenShort} name={text.green} value={rgb.g} max={255} onChange={g => onChange(rgbToHex({ ...rgb, g }))} />
                  <Channel label={text.blueShort} name={text.blue} value={rgb.b} max={255} onChange={b => onChange(rgbToHex({ ...rgb, b }))} />
                </>
              ) : (
                <>
                  <Channel label={text.hueShort} name={text.hue} value={Math.round(hsv.h) % 360} max={359} onChange={h => emitHsv({ ...hsv, h })} />
                  <Channel label={text.saturationShort} name={text.saturation} value={Math.round(hsv.s)} max={100} onChange={s => emitHsv({ ...hsv, s })} />
                  <Channel label={text.brightnessShort} name={text.brightness} value={Math.round(hsv.v)} max={100} onChange={v => emitHsv({ ...hsv, v })} />
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <SearchInput
              className="h-8 text-sm"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={text.searchPalette(activePalette.label)}
              aria-label={text.searchPalette(activePalette.label)}
              autoFocus
            />
            <div className="scrollbar-thin grid max-h-64 gap-0.5 overflow-y-auto pr-1">
              {filtered.map(swatch => {
                const active = swatch.id === selectedSwatch;
                return (
                  <button
                    type="button"
                    key={swatch.id}
                    aria-pressed={active}
                    onClick={() => onChange(normalizeHex(swatch.value), swatch)}
                    className={cn(
                      "focus-ring grid h-8 grid-cols-[1.25rem_1fr_1rem] items-center gap-2 rounded px-1.5 text-left text-xs hover:bg-subtle",
                      active && "bg-subtle text-fg",
                    )}
                    title={swatch.label}
                  >
                    <span className="size-5 rounded border border-border-strong" style={{ backgroundColor: normalizeHex(swatch.value) }} />
                    <span className="truncate">{swatch.label}</span>
                    {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                  </button>
                );
              })}
              {!filtered.length && <p className="px-2 py-5 text-center text-xs text-fg-muted">{text.noPaletteMatches}</p>}
            </div>
          </>
        )}
      </div>
    </Popover>
  );
}

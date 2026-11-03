import { useSyncExternalStore } from "react";

/**
 * Runtime token store. Overrides are written as inline custom properties on
 * <html>, kept per theme (shared / light / dark), persisted to localStorage,
 * and re-applied whenever the theme attribute changes.
 */

export type Scope = "shared" | "light" | "dark";
export type Overrides = Record<Scope, Record<string, string>>;

const storageKey = "whisperink-tokens";
const empty = (): Overrides => ({ shared: {}, light: {}, dark: {} });
let overrides: Overrides = load();
/** Snapshot object replaced on every change so React re-renders subscribers. */
let snapshot = { overrides, theme: "light" as "light" | "dark" };
const listeners = new Set<() => void>();

function load(): Overrides {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "") as Partial<Overrides>;
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(overrides));
  } catch {
    /* storage unavailable */
  }
}

export function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Writes the active override set to <html>; earlier inline values are cleared first. */
export function applyTokens() {
  const style = document.documentElement.style;
  for (let index = style.length - 1; index >= 0; index -= 1) {
    const name = style.item(index);
    if (name.startsWith("--")) style.removeProperty(name);
  }
  for (const scope of ["shared", currentTheme()] as const) {
    for (const [name, value] of Object.entries(overrides[scope])) style.setProperty(name, value);
  }
}

function emit() {
  persist();
  applyTokens();
  snapshot = { overrides, theme: currentTheme() };
  listeners.forEach((listener) => listener());
}

export function setToken(name: string, value: string, scope: Scope) {
  overrides = { ...overrides, [scope]: { ...overrides[scope], [name]: value } };
  emit();
}

export function clearToken(name: string, scope: Scope) {
  const { [name]: _removed, ...rest } = overrides[scope];
  overrides = { ...overrides, [scope]: rest };
  emit();
}

export function resetTokens() {
  overrides = empty();
  emit();
}

/** The current overrides, e.g. to store a tenant's theme on the server. */
export function getOverrides(): Overrides {
  return overrides;
}

/** Replaces every override at once, e.g. with a theme loaded from the server or from `parseTokenCss`. */
export function replaceOverrides(next: Partial<Overrides>) {
  overrides = { ...empty(), ...next };
  emit();
}

export function overrideCount(): number {
  return Object.values(overrides).reduce((total, scope) => total + Object.keys(scope).length, 0);
}

const selectors: Record<Scope, string> = { shared: ":root", light: ':root:not([data-theme="dark"])', dark: '[data-theme="dark"]' };

/**
 * Current overrides as a CSS snippet ready to paste into tokens.css: shared
 * values on `:root`, light-only and dark-only values in their own blocks, so
 * `parseTokenCss` reads it back without losing which theme a value belongs to.
 */
export function exportCss(): string {
  const block = (scope: Scope) => {
    const values = Object.entries(overrides[scope]);
    return values.length ? `${selectors[scope]} {\n${values.map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}` : "";
  };
  return (["shared", "light", "dark"] as const).map(block).filter(Boolean).join("\n\n") || "/* No changes */";
}

/**
 * Reads custom properties out of CSS written by `exportCss` (or by hand in the
 * same shape) into overrides for `replaceOverrides`. Declarations under other
 * selectors are ignored.
 */
export function parseTokenCss(css: string): Overrides {
  const result = empty();
  const scopeOf = (selector: string): Scope | null => {
    const normalized = selector.replace(/\s+/g, "").replace(/'/g, '"');
    if (normalized === ":root") return "shared";
    if (normalized === ':root:not([data-theme="dark"])' || normalized === ':root[data-theme="light"]') return "light";
    if (normalized === '[data-theme="dark"]' || normalized === ':root[data-theme="dark"]') return "dark";
    return null;
  };
  for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const scope = scopeOf(rule[1]!.trim());
    if (!scope) continue;
    for (const [, name, value] of rule[2]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)) result[scope][name!] = value!;
  }
  return result;
}

/** Resolved value of a custom property for the current theme and overrides. */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders the caller whenever overrides or the theme change. */
export function useTokens(): { overrides: Overrides; theme: "light" | "dark" } {
  return useSyncExternalStore(subscribe, () => snapshot);
}

// Keep inline overrides in sync with the theme toggle.
if (typeof document !== "undefined") {
  applyTokens();
  snapshot = { overrides, theme: currentTheme() };
  new MutationObserver(() => {
    applyTokens();
    snapshot = { overrides, theme: currentTheme() };
    listeners.forEach((listener) => listener());
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

/* ------------------------------------------------------------------ theme mode */

/** `system` follows the operating system and keeps following it as it changes. */
export type ThemeMode = "light" | "dark" | "system";

const modeKey = "whisperink-theme-mode";
const modeListeners = new Set<() => void>();
let mode: ThemeMode = readStoredMode();

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(modeKey);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
}

/**
 * Writes the resolved theme to `<html data-theme>`, which is what `tokens.css`
 * switches on — `system` is resolved here rather than in CSS so one attribute
 * always describes the active theme.
 */
function applyMode() {
  if (typeof document === "undefined") return;
  const resolved = mode === "system" ? (prefersDark() ? "dark" : "light") : mode;
  document.documentElement.dataset.theme = resolved;
}

export function themeMode(): ThemeMode {
  return mode;
}

export function setThemeMode(next: ThemeMode) {
  mode = next;
  try {
    localStorage.setItem(modeKey, next);
  } catch {
    /* storage unavailable */
  }
  applyMode();
  modeListeners.forEach((listener) => listener());
}

/** Re-renders the caller when the preference changes; `theme` is the resolved light/dark value. */
export function useThemeMode(): { mode: ThemeMode; theme: "light" | "dark" } {
  const current = useSyncExternalStore(
    (listener) => {
      modeListeners.add(listener);
      return () => modeListeners.delete(listener);
    },
    () => mode,
    () => "system" as ThemeMode,
  );
  return { mode: current, theme: useTokens().theme };
}

if (typeof document !== "undefined") {
  applyMode();
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (mode === "system") applyMode();
  });
}

/* ------------------------------------------------------------------ helpers */

export function rgbToHex(triplet: string): string {
  const [r, g, b] = triplet.split(/\s+/).map(Number);
  return `#${[r, g, b].map((channel) => Math.max(0, Math.min(255, channel || 0)).toString(16).padStart(2, "0")).join("")}`;
}

export function hexToRgb(hex: string): string {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) return "0 0 0";
  return match.slice(1).map((channel) => Number.parseInt(channel, 16)).join(" ");
}

/* ------------------------------------------------------------------ core scales & component aliases */

export type CoreKind = "radius" | "borderWidth" | "borderColor" | "shadow";

/** Core values a component alias may point at, in display order. */
export const coreOptions: Record<CoreKind, readonly { name: string; label: string }[]> = {
  radius: [
    { name: "--radius-none", label: "none" },
    { name: "--radius-sm", label: "sm" },
    { name: "--radius", label: "base" },
    { name: "--radius-md", label: "md" },
    { name: "--radius-lg", label: "lg" },
    { name: "--radius-xl", label: "xl" },
    { name: "--radius-full", label: "full" },
  ],
  borderWidth: [
    { name: "--border-none", label: "none" },
    { name: "--border-hairline", label: "hairline" },
    { name: "--border-thick", label: "thick" },
  ],
  borderColor: [
    { name: "--border", label: "border" },
    { name: "--border-strong", label: "border-strong" },
    { name: "--primary", label: "primary" },
  ],
  shadow: [
    { name: "--shadow-none", label: "none" },
    { name: "--shadow-xs", label: "xs" },
    { name: "--shadow-sm", label: "sm" },
    { name: "--shadow-md", label: "md" },
    { name: "--shadow-lg", label: "lg" },
  ],
};

export type ComponentAlias = { label: string; tokens: Partial<Record<CoreKind, string>> };

/** Component aliases and the alias token per core kind; defaults live in tokens.css. */
export const componentAliases: readonly ComponentAlias[] = [
  { label: "Button", tokens: { radius: "--button-radius", borderWidth: "--button-border-width", borderColor: "--button-border-color", shadow: "--button-shadow" } },
  { label: "Input", tokens: { radius: "--control-radius", borderWidth: "--control-border-width", borderColor: "--control-border-color", shadow: "--control-shadow" } },
  { label: "Card", tokens: { radius: "--card-radius", borderWidth: "--card-border-width", borderColor: "--card-border-color", shadow: "--card-shadow" } },
  { label: "Menu", tokens: { radius: "--menu-radius", borderWidth: "--menu-border-width", borderColor: "--menu-border-color", shadow: "--menu-shadow" } },
  { label: "Dialog", tokens: { radius: "--modal-radius", borderWidth: "--modal-border-width", borderColor: "--modal-border-color", shadow: "--modal-shadow" } },
  { label: "Badge", tokens: { radius: "--badge-radius", borderWidth: "--badge-border-width", borderColor: "--badge-border-color" } },
  { label: "Segmented", tokens: { radius: "--segmented-radius", shadow: "--segmented-shadow" } },
  { label: "Tabs", tokens: { borderWidth: "--tab-indicator-width" } },
  { label: "Tooltip", tokens: { radius: "--tooltip-radius", shadow: "--tooltip-shadow" } },
  { label: "Alert", tokens: { radius: "--alert-radius", borderWidth: "--alert-border-width" } },
];

const aliasDefaults: Record<string, string> = {
  "--button-radius": "--radius", "--button-border-width": "--border-none", "--button-border-color": "--border", "--button-shadow": "--shadow-md",
  "--control-radius": "--radius", "--control-border-width": "--border-hairline", "--control-border-color": "--border", "--control-shadow": "--shadow-xs",
  "--card-radius": "--radius", "--card-border-width": "--border-none", "--card-border-color": "--border", "--card-shadow": "--shadow-lg",
  "--menu-radius": "--radius", "--menu-border-width": "--border-none", "--menu-border-color": "--border", "--menu-shadow": "--shadow-lg",
  "--modal-radius": "--radius", "--modal-border-width": "--border-none", "--modal-border-color": "--border", "--modal-shadow": "--shadow-lg",
  "--badge-radius": "--radius-sm", "--badge-border-width": "--border-none", "--badge-border-color": "--border",
  "--segmented-radius": "--radius", "--segmented-item-radius": "--radius", "--segmented-shadow": "--shadow-md",
  "--tab-indicator-width": "--border-thick",
  "--tooltip-radius": "--radius-sm", "--tooltip-shadow": "--shadow-lg",
  "--alert-radius": "--radius", "--alert-border-width": "--border-none",
};

/** Core token an alias currently points at (override or default); empty for an unknown alias. */
export function aliasTarget(alias: string): string {
  const value = overrides.shared[alias];
  const match = value && /^var\((--[\w-]+)\)$/.exec(value);
  return match ? match[1]! : aliasDefaults[alias] ?? "";
}

export function setAlias(alias: string, core: string) {
  if (core === aliasDefaults[alias]) clearToken(alias, "shared");
  else setToken(alias, `var(${core})`, "shared");
}


/* ------------------------------------------------------------------ fonts */

export type FontCategory = "sans" | "serif" | "display" | "mono";
export type FontOption = { name: string; stack: string; category: FontCategory; /** Google Fonts family for on-demand loading in the demo; self-host in products. */ google?: string; weights?: string; /** Not available from Google Fonts: bundled with the kit, installed locally, or self-hosted by the product. */ local?: boolean };

/** Curated free typefaces that suit a neutral, data-heavy UI. */
export const fontCatalog: readonly FontOption[] = [
  { name: "Inter", stack: '"Inter", "Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif', category: "sans", google: "Inter" },
  { name: "Versavolta Serif", stack: '"Versavolta Serif", "Source Sans 3", "Segoe UI", system-ui, sans-serif', category: "serif", local: true },
  { name: "Source Sans 3", stack: '"Source Sans 3", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Source Sans 3" },
  { name: "IBM Plex Sans", stack: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif', category: "sans", google: "IBM Plex Sans" },
  { name: "Roboto", stack: '"Roboto", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Roboto" },
  { name: "Open Sans", stack: '"Open Sans", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Open Sans" },
  { name: "Lato", stack: '"Lato", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Lato" },
  { name: "Nunito Sans", stack: '"Nunito Sans", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Nunito Sans" },
  { name: "Work Sans", stack: '"Work Sans", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Work Sans" },
  { name: "DM Sans", stack: '"DM Sans", "Segoe UI", system-ui, sans-serif', category: "sans", google: "DM Sans" },
  { name: "Manrope", stack: '"Manrope", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Manrope" },
  { name: "Figtree", stack: '"Figtree", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Figtree" },
  { name: "Plus Jakarta Sans", stack: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Plus Jakarta Sans" },
  { name: "Public Sans", stack: '"Public Sans", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Public Sans" },
  { name: "Karla", stack: '"Karla", "Segoe UI", system-ui, sans-serif', category: "sans", google: "Karla" },
  { name: "Space Grotesk", stack: '"Space Grotesk", "Segoe UI", system-ui, sans-serif', category: "display", google: "Space Grotesk" },
  { name: "Sora", stack: '"Sora", "Segoe UI", system-ui, sans-serif', category: "display", google: "Sora" },
  { name: "Outfit", stack: '"Outfit", "Segoe UI", system-ui, sans-serif', category: "display", google: "Outfit" },
  { name: "Fraunces", stack: '"Fraunces", Georgia, "Times New Roman", serif', category: "serif", google: "Fraunces", weights: "400;500;600;700" },
  { name: "Playfair Display", stack: '"Playfair Display", Georgia, "Times New Roman", serif', category: "serif", google: "Playfair Display" },
  { name: "Lora", stack: '"Lora", Georgia, "Times New Roman", serif', category: "serif", google: "Lora" },
  { name: "Merriweather", stack: '"Merriweather", Georgia, "Times New Roman", serif', category: "serif", google: "Merriweather", weights: "400;700" },
  { name: "Source Serif 4", stack: '"Source Serif 4", Georgia, "Times New Roman", serif', category: "serif", google: "Source Serif 4" },
  { name: "JetBrains Mono", stack: '"JetBrains Mono", Consolas, ui-monospace, monospace', category: "mono", google: "JetBrains Mono" },
  { name: "IBM Plex Mono", stack: '"IBM Plex Mono", Consolas, ui-monospace, monospace', category: "mono", google: "IBM Plex Mono" },
  { name: "System", stack: 'ui-sans-serif, system-ui, "Segoe UI", sans-serif', category: "sans" },
];

export type FontPairing = { name: string; heading: string; body: string; note: string; /** Headline letter-spacing in em; omitted = the CSS default. */ tracking?: string };

/** Families behind the `tokens.css` defaults (`--font-sans`, `--font-heading`). */
export const defaultFonts = { body: "Figtree", heading: "Figtree" } as const;

/** Headline/body combinations that work out of the box. Names refer to `fontCatalog`. */
export const fontPairings: readonly FontPairing[] = [
  { name: "Figtree", heading: "Figtree", body: "Figtree", note: "The default: friendly, one family" },
  { name: "Outfit", heading: "Outfit", body: "Outfit", note: "Geometric, one family", tracking: "-0.01em" },
  { name: "Versavolta Serif + Source Sans", heading: "Versavolta Serif", body: "Source Sans 3", note: "The house face for headings (bundled), Source Sans for text", tracking: "-0.01em" },
  { name: "Versavolta Serif + Inter", heading: "Versavolta Serif", body: "Inter", note: "The house face for headings, technical text", tracking: "-0.01em" },
  { name: "Inter", heading: "Inter", body: "Inter", note: "Neutral, one family", tracking: "-0.02em" },
  { name: "IBM Plex", heading: "IBM Plex Sans", body: "IBM Plex Sans", note: "Technical, one family", tracking: "-0.02em" },
  { name: "Fraunces + Inter", heading: "Fraunces", body: "Inter", note: "Warm serif headings, technical text", tracking: "0em" },
  { name: "Playfair + Source Sans", heading: "Playfair Display", body: "Source Sans 3", note: "Classic, editorial", tracking: "-0.01em" },
  { name: "Space Grotesk + IBM Plex", heading: "Space Grotesk", body: "IBM Plex Sans", note: "Technical, distinctive", tracking: "-0.02em" },
  { name: "Sora + DM Sans", heading: "Sora", body: "DM Sans", note: "Geometric, friendly", tracking: "-0.02em" },
  { name: "Manrope", heading: "Manrope", body: "Manrope", note: "Modern, one family", tracking: "-0.02em" },
  { name: "Lora + Open Sans", heading: "Lora", body: "Open Sans", note: "Calm, easy on the eyes", tracking: "-0.01em" },
  { name: "Outfit + Public Sans", heading: "Outfit", body: "Public Sans", note: "Clear, at home in the public sector", tracking: "-0.015em" },
  { name: "Source Serif + Source Sans", heading: "Source Serif 4", body: "Source Sans 3", note: "Adobe’s superfamily", tracking: "-0.01em" },
];

export function fontByName(name: string): FontOption | undefined {
  return fontCatalog.find((font) => font.name === name);
}

export function fontByStack(stack: string): FontOption | undefined {
  const normalized = stack.replace(/\s/g, "");
  return fontCatalog.find((font) => font.stack.replace(/\s/g, "") === normalized);
}

const loadedFonts = new Set<string>();

/**
 * Loads a catalogue font from Google Fonts on demand (demo convenience).
 * Products should self-host the chosen families and skip this.
 */
export function loadFont(name: string) {
  const font = fontByName(name);
  if (!font?.google || loadedFonts.has(font.google) || typeof document === "undefined") return;
  loadedFonts.add(font.google);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.google).replace(/%20/g, "+")}:wght@${font.weights ?? "400;500;600;700"}&display=swap`;
  document.head.append(link);
}

/** Applies a catalogue font to body text or headlines; `null` restores the `tokens.css` default. */
export function setFont(role: "body" | "heading", name: string | null) {
  const token = role === "body" ? "--font-sans" : "--font-heading";
  if (!name) { clearToken(token, "shared"); return; }
  const font = fontByName(name);
  if (!font) return;
  loadFont(name);
  if (name === defaultFonts[role]) clearToken(token, "shared");
  else setToken(token, font.stack, "shared");
}

/** Headline letter-spacing (`--heading-tracking`), e.g. "-0.02em"; `null` restores the default. */
export function setHeadingTracking(value: string | null) {
  if (value === null) clearToken("--heading-tracking", "shared");
  else setToken("--heading-tracking", value, "shared");
}

export function applyPairing(pairing: FontPairing) {
  setFont("body", pairing.body);
  setFont("heading", pairing.heading);
  setHeadingTracking(pairing.tracking ?? null);
}

// Load the default families and any fonts referenced by persisted overrides.
if (typeof document !== "undefined") {
  for (const [token, fallback] of [["--font-sans", defaultFonts.body], ["--font-heading", defaultFonts.heading]] as const) {
    const font = overrides.shared[token] ? fontByStack(overrides.shared[token]) : fontByName(fallback);
    if (font) loadFont(font.name);
  }
}

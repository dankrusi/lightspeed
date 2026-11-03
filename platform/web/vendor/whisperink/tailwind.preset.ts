import type { Config } from "tailwindcss";

/**
 * Tailwind preset for Whisperink. Every colour, radius, shadow and type
 * step resolves through the CSS variables declared in `src/tokens.css`, so a
 * consuming app only needs this preset plus that stylesheet.
 *
 *   presets: [whisperinkPreset],
 *   content: ["./src/**​/*.{ts,tsx}", "./vendor/whisperink/src/**​/*.{ts,tsx}"],
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const whisperinkPreset = {
  darkMode: ["selector", '[data-theme="dark"]'],
  safelist: ["2xs", "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"].map((step) => `text-${step}`),
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        subtle: token("subtle"),
        muted: token("muted"),
        overlay: token("overlay"),
        border: { DEFAULT: token("border"), strong: token("border-strong") },
        fg: { DEFAULT: token("fg"), muted: token("fg-muted"), subtle: token("fg-subtle"), inverse: token("fg-inverse") },
        primary: { DEFAULT: token("primary"), hover: token("primary-hover"), fg: token("primary-fg") },
        "on-status": token("on-status"),
        success: { DEFAULT: token("success"), soft: token("success-soft"), fg: token("success-fg") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft"), fg: token("warning-fg") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft"), fg: token("danger-fg") },
        info: { DEFAULT: token("info"), soft: token("info-soft"), fg: token("info-fg") },
      },
      borderRadius: { none: "0px", sm: "var(--radius-sm)", DEFAULT: "var(--radius)", md: "var(--radius-md)", lg: "var(--radius-lg)", xl: "var(--radius-xl)", full: "9999px" },
      letterSpacing: { heading: "var(--heading-tracking)" },
      fontFamily: {
        sans: ["var(--font-sans)"],
        heading: ["var(--font-heading)"],
        mono: ["JetBrains Mono", "Cascadia Code", "Consolas", "ui-monospace", "monospace"],
      },
      fontSize: Object.fromEntries(
        ["2xs", "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"].map((step) => [step, [`var(--fs-${step})`, { lineHeight: `var(--lh-${step})` }]]),
      ),
      boxShadow: {
        none: "var(--shadow-none)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        ring: "0 0 0 1px rgb(var(--border-strong))",
        /* component aliases – re-pointable in the Foundations editor */
        button: "var(--button-shadow)",
        control: "var(--control-shadow)",
        card: "var(--card-shadow)",
        menu: "var(--menu-shadow)",
        modal: "var(--modal-shadow)",
        segmented: "var(--segmented-shadow)",
        tooltip: "var(--tooltip-shadow)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(2px)" }, to: { opacity: "1", transform: "none" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.98)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
        "scale-in": "scale-in 140ms ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
} satisfies Partial<Config>;

export default whisperinkPreset;

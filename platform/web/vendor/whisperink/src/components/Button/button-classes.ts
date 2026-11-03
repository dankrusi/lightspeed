import { cn } from "../../cn.js";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const base =
  "focus-ring inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--button-radius)] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg shadow-button hover:bg-primary-hover",
  secondary: "bg-subtle text-fg shadow-button hover:bg-muted",
  outline: "border-[length:var(--button-border-width)] border-[rgb(var(--button-border-color))] bg-surface text-fg shadow-button hover:bg-subtle",
  ghost: "text-fg hover:bg-subtle",
  danger: "bg-danger text-on-status shadow-button hover:opacity-90",
  link: "h-auto px-0 text-fg underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, { box: string; padding: string; square: string }> = {
  // `xs` is for affordances that sit inside another control's row rather than
  // beside it: a property row's revert buttons, a tag's dismiss. It is below the
  // control grid on purpose, so it reads as part of the row it is in.
  xs: { box: "h-6 text-xs [&_svg]:size-3", padding: "px-2", square: "w-6" },
  sm: { box: "h-8 text-sm [&_svg]:size-3.5", padding: "px-2.5", square: "w-8" },
  md: { box: "h-9 text-base [&_svg]:size-4", padding: "px-3.5", square: "w-9" },
  lg: { box: "h-10 text-base [&_svg]:size-4", padding: "px-4", square: "w-10" },
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string, iconOnly = false) {
  const dimensions = sizes[size];
  return cn(base, variants[variant], variant !== "link" && dimensions.box, variant !== "link" && (iconOnly ? dimensions.square : dimensions.padding), className);
}

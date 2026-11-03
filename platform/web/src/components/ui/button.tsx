import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@versavolta/whisperink/components/Button/button-classes.js"

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type Size = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"

const variants: Record<Variant, ButtonVariant> = {
  default: "primary",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
  destructive: "danger",
  link: "link",
}

const sizes: Record<Size, ButtonSize> = {
  default: "md",
  xs: "xs",
  sm: "sm",
  lg: "lg",
  icon: "md",
  "icon-xs": "xs",
  "icon-sm": "sm",
  "icon-lg": "lg",
}

function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: Variant | null
  size?: Size | null
  className?: string
}) {
  const resolvedVariant = variant ?? "default"
  const resolvedSize = size ?? "default"
  return buttonClasses(
    variants[resolvedVariant],
    sizes[resolvedSize],
    className,
    String(resolvedSize).startsWith("icon"),
  )
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & { variant?: Variant | null; size?: Size | null }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={(state) => buttonVariants({
        variant,
        size,
        className: typeof className === "function" ? className(state) : className,
      })}
      {...props}
    />
  )
}

export { Button, buttonVariants }

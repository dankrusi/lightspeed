import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import { Button as WhisperinkButton } from "@versavolta/whisperink/components/Button/Button.js"
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@versavolta/whisperink/components/Button/button-classes.js"
import { cn } from "@/lib/utils"

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
  return buttonClasses(variants[resolvedVariant], sizes[resolvedSize], className, String(resolvedSize).startsWith("icon"))
}

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton: _nativeButton,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: Variant | null
  size?: Size | null
  render?: ReactElement<{ className?: string; children?: ReactNode; onClick?: (event: React.MouseEvent) => void }>
  nativeButton?: boolean
}) {
  const resolvedVariant = variant ?? "default"
  const resolvedSize = size ?? "default"
  if (isValidElement(render)) {
    return cloneElement(render, {
      className: cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className: typeof className === "string" ? className : undefined }), render.props.className),
      children: children ?? render.props.children,
      "aria-label": props["aria-label"],
      title: props.title,
    })
  }
  return (
    <WhisperinkButton
      variant={variants[resolvedVariant]}
      size={sizes[resolvedSize]}
      className={typeof className === "string" ? className : undefined}
      {...props}
    >
      {children}
    </WhisperinkButton>
  )
}

export { Button, buttonVariants }

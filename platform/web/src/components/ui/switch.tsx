import type { ComponentProps } from "react"
import { Switch as WhisperinkSwitch } from "@versavolta/whisperink/components/Switch/Switch.js"

function Switch({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: Omit<ComponentProps<"input">, "checked" | "onChange" | "type" | "size"> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <span className={className}>
      <WhisperinkSwitch
        checked={checked}
        disabled={disabled}
        aria-checked={checked ? "true" : "false"}
        aria-disabled={disabled ? "true" : undefined}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
    </span>
  )
}

export { Switch }

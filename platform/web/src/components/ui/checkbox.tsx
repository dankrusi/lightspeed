import type { ComponentProps } from "react"
import { Checkbox as WhisperinkCheckbox } from "@versavolta/whisperink/components/Checkbox/Checkbox.js"

type CheckedState = boolean | "indeterminate"

function Checkbox({
  checked,
  onCheckedChange,
  indeterminate,
  className,
  ...props
}: Omit<ComponentProps<"input">, "checked" | "onChange" | "size"> & {
  checked?: CheckedState
  onCheckedChange?: (checked: boolean) => void
  indeterminate?: boolean
}) {
  const mixed = indeterminate || checked === "indeterminate"
  return (
    <span className={className}>
      <WhisperinkCheckbox
        checked={checked === true}
        indeterminate={mixed}
        role="checkbox"
        aria-checked={mixed ? "mixed" : checked === true ? "true" : "false"}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
    </span>
  )
}

export { Checkbox }

import type { ComponentProps } from "react"
import { Input as WhisperinkInput } from "@versavolta/whisperink/components/Input/Input.js"

function Input({ className, ...props }: Omit<ComponentProps<"input">, "size">) {
  return <WhisperinkInput data-slot="input" className={className} {...props} />
}

export { Input }

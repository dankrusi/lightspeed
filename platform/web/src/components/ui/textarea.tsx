import type { ComponentProps } from "react"
import { Textarea as WhisperinkTextarea } from "@versavolta/whisperink/components/Textarea/Textarea.js"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <WhisperinkTextarea data-slot="textarea" className={className} {...props} />
}

export { Textarea }

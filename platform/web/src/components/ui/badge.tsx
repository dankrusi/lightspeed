import type { HTMLAttributes } from "react"
import { Badge as WhisperinkBadge } from "@versavolta/whisperink/components/Badge/Badge.js"
import type { Tone } from "@versavolta/whisperink/tone.js"

type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

const tones: Record<Variant, Tone> = {
  default: "neutral",
  secondary: "neutral",
  destructive: "danger",
  outline: "neutral",
  ghost: "neutral",
  link: "neutral",
}

function Badge({
  className,
  variant = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant | null }) {
  const resolved = variant ?? "default"
  return (
    <WhisperinkBadge tone={tones[resolved]} outline={resolved === "outline" || resolved === "ghost"} className={className} {...props}>
      {children}
    </WhisperinkBadge>
  )
}

export { Badge }

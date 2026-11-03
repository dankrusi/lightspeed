import type { ReactNode } from "react"
import { Avatar as WhisperinkAvatar } from "@versavolta/whisperink/components/Avatar/Avatar.js"

function Avatar({ className, children }: { className?: string; children?: ReactNode }) {
  return <span className={className}>{children}</span>
}

function AvatarImage({ src, alt }: { src?: string; alt?: string; className?: string }) {
  return src ? <WhisperinkAvatar initials={alt?.slice(0, 2) ?? ""} src={src} label={alt} /> : null
}

function AvatarFallback({ children, className }: { children?: ReactNode; className?: string }) {
  const initials = typeof children === "string" ? children : "?"
  return <WhisperinkAvatar initials={initials} className={className} />
}

export { Avatar, AvatarImage, AvatarFallback }

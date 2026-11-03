import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-slot="separator"
      className={cn(orientation === "vertical" ? "w-px self-stretch bg-border" : "h-px w-full bg-border", className)}
      {...props}
    />
  )
}

export { Separator }

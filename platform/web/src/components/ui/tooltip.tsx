import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import { Tooltip as WhisperinkTooltip } from "@versavolta/whisperink/components/Tooltip/Tooltip.js"
import { elements, named } from "@/components/ui/nodes"

function TooltipProvider({ children }: { children?: ReactNode; delay?: number }) {
  return <>{children}</>
}

function Tooltip({ children }: { children?: ReactNode }) {
  const parts = elements(children)
  const trigger = parts.find((child) => named(child) === "TooltipTrigger")
  const content = parts.find((child) => named(child) === "TooltipContent")
  const rendered = trigger?.props.render as ReactElement<{ children?: ReactNode; className?: string }> | undefined
  const child = rendered && isValidElement(rendered)
    ? cloneElement(rendered, { children: trigger?.props.children ?? rendered.props.children })
    : <span>{trigger?.props.children}</span>
  return <WhisperinkTooltip content={content?.props.children}>{child}</WhisperinkTooltip>
}

function TooltipTrigger({ children }: { render?: ReactElement; children?: ReactNode; className?: string; "aria-label"?: string }) {
  return <>{children}</>
}
TooltipTrigger.displayName = "TooltipTrigger"

function TooltipContent({ children }: { children?: ReactNode; className?: string; side?: string }) {
  return <>{children}</>
}
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

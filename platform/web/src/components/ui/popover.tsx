import { cloneElement, isValidElement, type MouseEvent, type ReactElement, type ReactNode } from "react"
import { Popover as WhisperinkPopover } from "@versavolta/whisperink/components/Popover/Popover.js"
import { elements, named } from "@/components/ui/nodes"

function Popover({ children }: { children?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const parts = elements(children)
  const trigger = parts.find((child) => named(child) === "PopoverTrigger")
  const content = parts.find((child) => named(child) === "PopoverContent")
  const side = content?.props.side === "top" ? "top" : "bottom"
  const align = content?.props.align === "end" ? "end" : "start"
  return (
    <WhisperinkPopover
      align={align}
      side={side}
      className={content?.props.className}
      trigger={({ toggle, open }) => {
        const rendered = trigger?.props.render as ReactElement<{ onClick?: (event: MouseEvent) => void; children?: ReactNode }> | undefined
        if (rendered && isValidElement(rendered)) {
          return cloneElement(rendered, {
            "aria-expanded": open,
            onClick: (event: MouseEvent) => { rendered.props.onClick?.(event); toggle() },
            children: trigger?.props.children ?? rendered.props.children,
          } as never)
        }
        return <button type="button" className={trigger?.props.className} aria-label={trigger?.props["aria-label"]} aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>{trigger?.props.children}</button>
      }}
    >
      {content?.props.children}
    </WhisperinkPopover>
  )
}

function PopoverTrigger({ children }: { render?: ReactElement; children?: ReactNode; className?: string; "aria-label"?: string }) {
  return <>{children}</>
}
PopoverTrigger.displayName = "PopoverTrigger"

function PopoverContent({ children }: { children?: ReactNode; className?: string; align?: string; side?: string; sideOffset?: number; alignOffset?: number }) {
  return <>{children}</>
}
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverContent, PopoverTrigger }

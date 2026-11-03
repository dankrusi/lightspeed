import { createContext, useContext, type ReactNode } from "react"

type State = { open: boolean; setOpen: (open: boolean) => void }
const CollapsibleContext = createContext<State>({ open: false, setOpen: () => {} })

function Collapsible({
  open = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}) {
  return <CollapsibleContext.Provider value={{ open, setOpen: (next) => onOpenChange?.(next) }}>{children}</CollapsibleContext.Provider>
}

function CollapsibleTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { open, setOpen } = useContext(CollapsibleContext)
  return (
    <button type="button" aria-expanded={open} className={className} onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  )
}

function CollapsibleContent({ children }: { children?: ReactNode; className?: string }) {
  const { open } = useContext(CollapsibleContext)
  if (!open) return null
  return <div>{children}</div>
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

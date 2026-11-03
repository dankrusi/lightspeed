import { cloneElement, createContext, useContext, type ReactElement, type ReactNode } from "react"
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js"
import { elements, named, textOf } from "@/components/ui/nodes"

type DialogState = { open: boolean; setOpen: (open: boolean) => void }
const DialogContext = createContext<DialogState>({ open: false, setOpen: () => {} })

function partition(children: ReactNode) {
  const body: ReactNode[] = []
  let title = ""
  let description: string | undefined
  let footer: ReactNode
  const take = (node: ReturnType<typeof elements>[number]) => {
    const name = named(node)
    if (name === "DialogHeader" || name === "AlertDialogHeader") {
      elements(node.props.children).forEach(take)
      return
    }
    if (name === "DialogTitle" || name === "AlertDialogTitle") {
      title = textOf(node.props.children).trim() || title
      return
    }
    if (name === "DialogDescription" || name === "AlertDialogDescription") {
      const text = textOf(node.props.children).trim()
      if (text) description = text
      else body.push(node)
      return
    }
    if (name === "DialogFooter" || name === "AlertDialogFooter") {
      footer = node.props.children
      return
    }
    body.push(node)
  }
  elements(children).forEach(take)
  return { title: title || "Dialog", description, footer, body }
}

function Dialog({
  open = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}) {
  return <DialogContext.Provider value={{ open, setOpen: (next) => onOpenChange?.(next) }}>{children}</DialogContext.Provider>
}

function DialogTrigger({ render, children }: { render?: ReactElement<{ onClick?: (event: React.MouseEvent) => void; children?: ReactNode; className?: string }>; children?: ReactNode }) {
  const { setOpen } = useContext(DialogContext)
  const open = () => setOpen(true)
  if (render) return cloneElement(render, { onClick: (event) => { render.props.onClick?.(event); open() }, children: children ?? render.props.children })
  return <button type="button" onClick={open}>{children}</button>
}

function DialogContent({
  children,
  showCloseButton = true,
  className,
}: {
  children?: ReactNode
  showCloseButton?: boolean
  className?: string
  ref?: unknown
  initialFocus?: unknown
  finalFocus?: unknown
}) {
  const { open, setOpen } = useContext(DialogContext)
  const parts = partition(children)
  const size = className?.includes("max-w-5xl") ? "xl" : className?.includes("max-w-2xl") ? "lg" : "md"
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={parts.title} description={parts.description} footer={parts.footer} size={size} dismissible={showCloseButton}>
      {parts.body}
    </Modal>
  )
}

function DialogHeader({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
DialogHeader.displayName = "DialogHeader"

function DialogFooter({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
DialogFooter.displayName = "DialogFooter"

function DialogTitle({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
DialogTitle.displayName = "DialogTitle"

function DialogDescription({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
DialogDescription.displayName = "DialogDescription"

function DialogClose({ children }: { children?: ReactNode }) {
  const { setOpen } = useContext(DialogContext)
  return <button type="button" onClick={() => setOpen(false)}>{children}</button>
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger }

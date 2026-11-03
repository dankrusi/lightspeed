import { cloneElement, createContext, useContext, useState, type MouseEvent, type ReactElement, type ReactNode } from "react"
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js"
import { Button } from "@/components/ui/button"
import { elements, named, textOf } from "@/components/ui/nodes"

type State = { open: boolean; setOpen: (open: boolean) => void }
const AlertContext = createContext<State>({ open: false, setOpen: () => {} })

function partition(children: ReactNode) {
  const body: ReactNode[] = []
  let title = ""
  let description: string | undefined
  let footer: ReactNode
  const take = (node: ReturnType<typeof elements>[number]) => {
    const name = named(node)
    if (name === "AlertDialogHeader") {
      elements(node.props.children).forEach(take)
      return
    }
    if (name === "AlertDialogTitle") {
      title = textOf(node.props.children).trim() || title
      return
    }
    if (name === "AlertDialogDescription") {
      const text = textOf(node.props.children).trim()
      if (text) description = text
      else body.push(node)
      return
    }
    if (name === "AlertDialogFooter") {
      footer = node.props.children
      return
    }
    body.push(node)
  }
  elements(children).forEach(take)
  return { title: title || "Confirm", description, footer, body }
}

function AlertDialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}) {
  const [internal, setInternal] = useState(false)
  const actual = open ?? internal
  const setOpen = (next: boolean) => {
    setInternal(next)
    onOpenChange?.(next)
  }
  return <AlertContext.Provider value={{ open: actual, setOpen }}>{children}</AlertContext.Provider>
}

function AlertDialogTrigger({
  render,
  children,
}: {
  render?: ReactElement<{ onClick?: (event: MouseEvent) => void; children?: ReactNode }>
  children?: ReactNode
}) {
  const { setOpen } = useContext(AlertContext)
  const open = (event: MouseEvent) => {
    render?.props.onClick?.(event)
    setOpen(true)
  }
  if (render) return cloneElement(render, { onClick: open, children: children ?? render.props.children })
  return <button type="button" onClick={() => setOpen(true)}>{children}</button>
}

function AlertDialogContent({ children }: { children?: ReactNode; className?: string }) {
  const { open, setOpen } = useContext(AlertContext)
  const parts = partition(children)
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={parts.title} description={parts.description} footer={parts.footer} size="sm" role="alertdialog">
      {parts.body}
    </Modal>
  )
}

function AlertDialogHeader({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
AlertDialogHeader.displayName = "AlertDialogHeader"

function AlertDialogFooter({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
AlertDialogFooter.displayName = "AlertDialogFooter"

function AlertDialogTitle({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
AlertDialogTitle.displayName = "AlertDialogTitle"

function AlertDialogDescription({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>
}
AlertDialogDescription.displayName = "AlertDialogDescription"

function AlertDialogCancel({ children, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { setOpen } = useContext(AlertContext)
  return <Button type="button" variant="outline" onClick={(event) => { onClick?.(event); setOpen(false) }} {...props}>{children}</Button>
}

function AlertDialogAction({ children, onClick, variant = "destructive", ...props }: React.ComponentProps<typeof Button>) {
  const { setOpen } = useContext(AlertContext)
  return <Button type="button" variant={variant} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) setOpen(false) }} {...props}>{children}</Button>
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js"
import { cn } from "@/lib/utils"

type Scroller = {
  viewport: RefObject<HTMLDivElement | null>
  scrollToEnd: (options?: { behavior?: ScrollBehavior }) => void
  scrollToMessage: (id: string, options?: ScrollIntoViewOptions) => void
  scrollable: boolean
  atEnd: boolean
  setEdges: (scrollable: boolean, atEnd: boolean) => void
  stick: React.MutableRefObject<boolean>
  preservePrepend: boolean
}

const ScrollerContext = createContext<Scroller | null>(null)

function useScroller() {
  const value = useContext(ScrollerContext)
  if (!value) throw new Error("Message scroller parts must be inside MessageScrollerProvider")
  return value
}

function MessageScrollerProvider({
  children,
  autoScroll = false,
}: {
  children?: ReactNode
  autoScroll?: boolean
  defaultScrollPosition?: string
}) {
  const viewport = useRef<HTMLDivElement | null>(null)
  const stick = useRef(autoScroll)
  const [scrollable, setScrollable] = useState(false)
  const [atEnd, setAtEnd] = useState(true)
  const measure = () => {
    const element = viewport.current
    if (!element) return
    const overflow = element.scrollHeight - element.clientHeight > 8
    const nearEnd = element.scrollHeight - element.scrollTop - element.clientHeight < 48
    setScrollable(overflow)
    setAtEnd(nearEnd || !overflow)
    if (!nearEnd && overflow) stick.current = false
  }
  const scrollToEnd = (options?: { behavior?: ScrollBehavior }) => {
    const element = viewport.current
    stick.current = true
    element?.scrollTo({ top: element.scrollHeight, behavior: options?.behavior ?? "auto" })
    setAtEnd(true)
  }
  const scrollToMessage = (id: string, options?: ScrollIntoViewOptions) => {
    viewport.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`)?.scrollIntoView(options)
  }
  const setEdges = (nextScrollable: boolean, nextAtEnd: boolean) => {
    setScrollable(nextScrollable)
    setAtEnd(nextAtEnd)
  }
  return (
    <ScrollerContext.Provider value={{ viewport, scrollToEnd, scrollToMessage, scrollable, atEnd, setEdges, stick, preservePrepend: false }}>
      {children}
    </ScrollerContext.Provider>
  )
}

function MessageScroller({ className, children }: { className?: string; children?: ReactNode }) {
  return <div data-slot="message-scroller" className={cn("relative flex size-full min-h-0 flex-col overflow-hidden", className)}>{children}</div>
}

function MessageScrollerViewport({
  className,
  children,
  preserveScrollOnPrepend = false,
}: {
  className?: string
  children?: ReactNode
  preserveScrollOnPrepend?: boolean
}) {
  const scroller = useScroller()
  const previous = useRef({ height: 0, top: 0 })
  useLayoutEffect(() => {
    const element = scroller.viewport.current
    if (!element) return
    const nextHeight = element.scrollHeight
    const delta = nextHeight - previous.current.height
    if (preserveScrollOnPrepend && delta > 0 && previous.current.top < 8 && previous.current.height > 0) {
      element.scrollTop += delta
    } else if (scroller.stick.current) {
      element.scrollTop = element.scrollHeight
    }
    previous.current = { height: element.scrollHeight, top: element.scrollTop }
    const overflow = element.scrollHeight - element.clientHeight > 8
    const nearEnd = element.scrollHeight - element.scrollTop - element.clientHeight < 48
    if (overflow !== scroller.scrollable || nearEnd !== scroller.atEnd) {
      // Measurement stays in the ref path; state updates happen on scroll.
    }
  })
  return (
    <div
      ref={scroller.viewport}
      data-slot="message-scroller-viewport"
      className={cn("scrollbar-thin size-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto", className)}
      onScroll={() => {
        const element = scroller.viewport.current
        if (!element) return
        const overflow = element.scrollHeight - element.clientHeight > 8
        const nearEnd = element.scrollHeight - element.scrollTop - element.clientHeight < 48
        scroller.stick.current = nearEnd
        scroller.setEdges(overflow, nearEnd || !overflow)
        previous.current.top = element.scrollTop
      }}
    >
      {children}
    </div>
  )
}

function MessageScrollerContent({ className, children }: { className?: string; children?: ReactNode }) {
  return <div data-slot="message-scroller-content" className={cn("flex h-max min-h-full min-w-0 max-w-full flex-col gap-8", className)}>{children}</div>
}

function MessageScrollerItem({
  className,
  messageId,
  children,
  onClickCapture,
}: {
  className?: string
  messageId?: string
  children?: ReactNode
  scrollAnchor?: boolean
  onClickCapture?: (event: React.MouseEvent) => void
}) {
  const scroller = useScroller()
  return (
    <div
      data-slot="message-scroller-item"
      data-message-id={messageId}
      className={cn("w-full min-w-0 max-w-full shrink-0", className)}
      onClickCapture={(event) => {
        onClickCapture?.(event)
        if (event.defaultPrevented || !messageId) return
        const target = event.target
        if (!(target instanceof Element) || !target.closest("[data-message-expansion]")) return
        scroller.scrollToMessage(messageId, { block: "nearest" })
      }}
    >
      {children}
    </div>
  )
}

function MessageScrollerButton({ className }: { className?: string; direction?: string; variant?: string; size?: string; children?: ReactNode }) {
  const scroller = useScroller()
  if (scroller.atEnd) return null
  return (
    <IconButton variant="secondary" size="sm" label="Scroll to end" className={cn("absolute bottom-4 left-1/2 -translate-x-1/2", className)} onClick={() => scroller.scrollToEnd({ behavior: "smooth" })}>
      ↓
    </IconButton>
  )
}

function useMessageScroller() {
  const scroller = useScroller()
  return { scrollToEnd: scroller.scrollToEnd, scrollToMessage: scroller.scrollToMessage }
}

function useMessageScrollerScrollable() {
  const scroller = useScroller()
  return { end: scroller.scrollable && !scroller.atEnd }
}

function useMessageScrollerVisibility() {
  return { atEnd: useScroller().atEnd }
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}

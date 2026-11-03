import { createContext, useContext, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type TabsState = { value: string | undefined; setValue: (value: string) => void }
const TabsContext = createContext<TabsState>({ value: undefined, setValue: () => {} })

function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: ReactNode
  className?: string
  orientation?: string
}) {
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal
  const setValue = (next: string) => {
    setInternal(next)
    onValueChange?.(next)
  }
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className, activateOnFocus, variant: _variant, ...props }: React.ComponentProps<"div"> & { variant?: string; activateOnFocus?: boolean }) {
  const tabs = useContext(TabsContext)
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-1 rounded-[var(--segmented-radius)] bg-subtle p-0.5", className)}
      onKeyDown={(event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        if (index < 0) return
        const next = buttons[(index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length]
        next?.focus()
        const value = next?.dataset.value
        if (activateOnFocus && value) tabs.setValue(value)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children?: ReactNode
  className?: string
  title?: string
}) {
  const tabs = useContext(TabsContext)
  const selected = tabs.value === value
  return (
    <button
      type="button"
      role="tab"
      data-value={value}
      aria-selected={selected}
      title={undefined}
      className={cn("focus-ring rounded-[var(--segmented-item-radius)] px-2.5 py-1 text-sm", selected ? "bg-surface font-medium text-fg shadow-segmented" : "text-fg-muted", className)}
      onClick={() => tabs.setValue(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className }: { value: string; children?: ReactNode; className?: string }) {
  const tabs = useContext(TabsContext)
  if (tabs.value !== value) return null
  return <div role="tabpanel" className={className}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

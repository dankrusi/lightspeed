import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Popover } from "@versavolta/whisperink/components/Popover/Popover.js"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ComboboxState<T extends string = string> = {
  items: readonly T[]
  query: string
  setQuery: (query: string) => void
  multiple: boolean
  value: T | readonly T[] | null
  onValueChange?: (value: any) => void
  disabled?: boolean
  filtered: readonly T[]
  choose: (value: T) => void
  remove: (value: T) => void
  openList: () => void
  /** The open popover's panel, where `ComboboxContent` draws the list; null while closed. */
  panel: HTMLElement | null
}

const ComboboxContext = createContext<ComboboxState | null>(null)

function useCombobox() {
  const value = useContext(ComboboxContext)
  if (!value) throw new Error("Combobox parts must be inside Combobox")
  return value
}

function Combobox<T extends string>({
  items = [],
  value = null,
  multiple = false,
  inputValue,
  onInputValueChange,
  onValueChange,
  itemToStringLabel = (item) => String(item),
  filter,
  disabled,
  children,
}: {
  items?: readonly T[]
  value?: T | readonly T[] | null
  multiple?: boolean
  inputValue?: string
  onInputValueChange?: (value: string) => void
  onValueChange?: (value: any) => void
  itemToStringLabel?: (item: T) => string
  filter?: (item: T, query: string) => boolean
  disabled?: boolean
  autoHighlight?: boolean
  children?: ReactNode
}) {
  const [localQuery, setLocalQuery] = useState("")
  const query = inputValue ?? localQuery
  const setQuery = (next: string) => {
    setLocalQuery(next)
    onInputValueChange?.(next)
  }
  const filtered = useMemo(() => items.filter((item) => {
    if (!query) return true
    if (filter) return filter(item, query)
    return itemToStringLabel(item).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  }), [items, query, filter, itemToStringLabel])
  const choose = (item: T) => {
    if (multiple) {
      const current = Array.isArray(value) ? [...value] : []
      const next = current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]
      onValueChange?.(next as T[])
      setQuery("")
      return
    }
    onValueChange?.(item)
    setQuery(itemToStringLabel(item))
  }
  const remove = (item: T) => {
    if (!Array.isArray(value)) return
    onValueChange?.(value.filter((entry) => entry !== item) as T[])
  }
  const openList = useRef(() => {})
  const [panel, setPanel] = useState<HTMLElement | null>(null)
  // Children render once, beside the input; ComboboxContent portals the list
  // into the panel, so it keeps this context without picking children apart.
  return (
    <ComboboxContext.Provider value={{ items, query, setQuery, multiple, value, onValueChange, disabled, filtered, choose, remove, openList: () => openList.current(), panel } as unknown as ComboboxState}>
      <Popover
        rootClassName="w-full"
        className="max-h-72 w-[min(24rem,calc(100vw-2rem))]"
        trigger={({ toggle, open }) => {
          openList.current = () => { if (!open) toggle() }
          return <div className="min-w-0 w-full">{children}</div>
        }}
      >
        <div ref={setPanel} />
      </Popover>
    </ComboboxContext.Provider>
  )
}

function ComboboxInput({
  id,
  placeholder,
  className,
  readOnly,
  showTrigger: _showTrigger,
  ...props
}: React.ComponentProps<"input"> & { showTrigger?: boolean }) {
  const box = useCombobox()
  return (
    <Input
      id={id}
      placeholder={placeholder}
      className={className}
      readOnly={readOnly}
      disabled={box.disabled}
      value={box.query}
      onFocus={() => box.openList()}
      onChange={(event) => { box.setQuery(event.target.value); box.openList() }}
      {...props}
    />
  )
}

function ComboboxContent({ children }: { children?: ReactNode }) {
  const box = useCombobox()
  return box.panel ? createPortal(children, box.panel) : null
}

function ComboboxEmpty({ children }: { children?: ReactNode }) {
  const box = useCombobox()
  if (box.filtered.length > 0) return null
  return <p className="px-2 py-1.5 text-sm text-fg-muted">{children}</p>
}

function ComboboxList({ children }: { children?: ReactNode | ((item: string) => ReactNode) }) {
  const box = useCombobox()
  if (typeof children === "function") {
    return <div className="grid">{box.filtered.map((item) => children(item))}</div>
  }
  return <div className="grid">{children}</div>
}

function ComboboxItem({ value, children, className }: { value: string; children?: ReactNode; className?: string }) {
  const box = useCombobox()
  return (
    <button type="button" className={cn("focus-ring rounded px-2 py-1.5 text-left text-sm hover:bg-subtle", className)} onClick={() => box.choose(value)}>
      {children}
    </button>
  )
}

function ComboboxChips({ children }: { children?: ReactNode }) {
  return <div className="flex min-h-9 flex-wrap items-center gap-1 rounded-[var(--control-radius)] border border-border bg-surface px-2 py-1">{children}</div>
}

function ComboboxValue({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

function ComboboxChip({ children, value }: { children?: ReactNode; value: string }) {
  const box = useCombobox()
  return (
    <span className="inline-flex items-center gap-1 rounded bg-subtle px-1.5 py-0.5 text-xs">
      {children}
      <button type="button" className="text-fg-muted" aria-label="Remove" disabled={box.disabled} onClick={() => box.remove(value)}>×</button>
    </span>
  )
}

function ComboboxChipsInput(props: React.ComponentProps<"input">) {
  return <ComboboxInput {...props} className={cn("h-7 border-0 shadow-none", props.className)} />
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
}

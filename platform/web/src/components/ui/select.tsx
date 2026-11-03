import { Children, isValidElement, type ReactElement, type ReactNode } from "react"
import { Select as WhisperinkSelect } from "@versavolta/whisperink/components/Select/Select.js"
import { named, textOf } from "@/components/ui/nodes"

type Item = { value: string; label: ReactNode }

function collect(children: ReactNode, into: Item[] = [], trigger: { id?: string; className?: string; disabled?: boolean; label?: string; format?: (value: string) => ReactNode } = {}) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const element = child as ReactElement<{ value?: unknown; children?: ReactNode; id?: string; className?: string; disabled?: boolean }>
    const name = named(element)
    if (name === "SelectItem") {
      into.push({ value: String(element.props.value ?? ""), label: element.props.children })
      return
    }
    if (name === "SelectTrigger") {
      trigger.id = element.props.id
      trigger.className = element.props.className
      trigger.disabled = element.props.disabled
      trigger.label = element.props["aria-label"]
    }
    if (name === "SelectValue" && typeof element.props.children === "function") {
      trigger.format = element.props.children as (value: string) => ReactNode
    }
    if (element.props.children) collect(element.props.children, into, trigger)
  })
  return { into, trigger }
}

function Select({
  value,
  onValueChange,
  disabled,
  children,
}: {
  value?: string | null
  onValueChange?: (value: string) => void
  disabled?: boolean
  children?: ReactNode
}) {
  const { into, trigger } = collect(children)
  const format = trigger.format
  const selected = into.find((item) => item.value === (value ?? ""))
  const label = format ? format(value ?? "") : textOf(selected?.label)
  return (
    <>
    <span data-slot="select-value" className="sr-only">{label}</span>
    <WhisperinkSelect
      id={trigger.id}
      aria-label={trigger.label}
      className={trigger.className}
      disabled={disabled || trigger.disabled}
      value={value ?? ""}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {into.map((item) => <option key={item.value} value={item.value}>{textOf(item.label)}</option>)}
    </WhisperinkSelect>
    </>
  )
}

function SelectTrigger(_props: { id?: string; className?: string; size?: string; children?: ReactNode; disabled?: boolean; "aria-label"?: string }) { return null }
SelectTrigger.displayName = "SelectTrigger"
function SelectContent({ children: _children }: { children?: ReactNode; className?: string; align?: string; side?: string; sideOffset?: number }) { return null }
SelectContent.displayName = "SelectContent"
function SelectItem(_props: { value?: string; children?: ReactNode; disabled?: boolean; className?: string }) { return null }
SelectItem.displayName = "SelectItem"
function SelectValue(_props: { children?: ReactNode | ((value: string) => ReactNode); placeholder?: string }) { return null }
SelectValue.displayName = "SelectValue"
function SelectGroup({ children: _children }: { children?: ReactNode; className?: string }) { return null }
function SelectLabel(_props: { children?: ReactNode; className?: string }) { return null }
function SelectSeparator() { return null }

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue }

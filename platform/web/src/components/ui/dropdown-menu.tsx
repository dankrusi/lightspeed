import { cloneElement, isValidElement, type MouseEvent, type ReactElement, type ReactNode } from "react"
import { Menu } from "@versavolta/whisperink/components/Menu/Menu.js"
import { MenuItem } from "@versavolta/whisperink/components/Menu/MenuItem.js"
import { MenuLabel } from "@versavolta/whisperink/components/Menu/MenuLabel.js"
import { MenuSeparator } from "@versavolta/whisperink/components/Menu/MenuSeparator.js"
import { elements, named } from "@/components/ui/nodes"

function DropdownMenu({ children }: { children?: ReactNode }) {
  const parts = elements(children)
  const trigger = parts.find((child) => named(child) === "DropdownMenuTrigger")
  const content = parts.find((child) => named(child) === "DropdownMenuContent")
  return (
    <Menu
      trigger={({ toggle, open }) => {
        const onKeyDown = (event: { key: string; preventDefault: () => void }) => {
          if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
            event.preventDefault()
            toggle()
          }
        }
        const rendered = trigger?.props.render as ReactElement<{ className?: string; children?: ReactNode; onClick?: (event: MouseEvent) => void; onKeyDown?: (event: unknown) => void }> | undefined
        if (rendered && isValidElement(rendered)) {
          return cloneElement(rendered, {
            "aria-expanded": open,
            "aria-haspopup": "menu" as const,
            onClick: (event: MouseEvent) => { rendered.props.onClick?.(event); toggle() },
            onKeyDown,
            children: trigger?.props.children ?? rendered.props.children,
          } as never)
        }
        return <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={toggle} onKeyDown={onKeyDown}>{trigger?.props.children}</button>
      }}
    >
      {content?.props.children}
    </Menu>
  )
}

function DropdownMenuTrigger({ children }: { render?: ReactElement; children?: ReactNode }) {
  return <>{children}</>
}
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

function DropdownMenuContent({ children }: { children?: ReactNode; className?: string; align?: string; side?: string }) {
  return <>{children}</>
}
DropdownMenuContent.displayName = "DropdownMenuContent"

function DropdownMenuGroup({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

function DropdownMenuLabel({ children }: { children?: ReactNode; className?: string }) {
  return <MenuLabel>{children}</MenuLabel>
}

function DropdownMenuItem({
  children,
  onClick,
  disabled,
  variant,
}: {
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLElement>) => void
  disabled?: boolean
  variant?: "default" | "destructive"
  className?: string
  title?: string
}) {
  return (
    <MenuItem
      danger={variant === "destructive"}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.click() }}
    >
      {children}
    </MenuItem>
  )
}

function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  disabled,
}: {
  children?: ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  closeOnClick?: boolean
}) {
  return <MenuItem checked={checked} disabled={disabled} onClick={() => onCheckedChange?.(!checked)}>{children}</MenuItem>
}

function DropdownMenuRadioGroup({ children }: { children?: ReactNode; value?: string; onValueChange?: (value: string) => void }) {
  return <>{children}</>
}

function DropdownMenuRadioItem({ children, value }: { children?: ReactNode; value?: string }) {
  return <MenuItem>{children ?? value}</MenuItem>
}

function DropdownMenuSeparator() {
  return <MenuSeparator />
}

function DropdownMenuShortcut({ children }: { children?: ReactNode }) {
  return <span className="text-xs text-fg-subtle">{children}</span>
}

function DropdownMenuSub({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
function DropdownMenuSubTrigger({ children }: { children?: ReactNode }) {
  return <MenuItem>{children}</MenuItem>
}
function DropdownMenuSubContent({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}

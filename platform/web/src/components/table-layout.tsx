import type { ComponentProps, ReactNode } from "react"
import { TD } from "@versavolta/whisperink/components/Table/TD.js"
import { cn } from "@/lib/utils"

/// Bordered, rounded frame for a resource table; clips the table's own edges.
function TableCard({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="table-card" className={cn("min-w-0 max-w-full overflow-hidden rounded-[var(--card-radius)] border border-border", className)} {...props} />
}

/// A machine identifier: monospace, truncated, with the full value as its title.
function IdText({ className, children, title, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="id-text"
      title={title ?? (typeof children === "string" ? children : undefined)}
      className={cn("block min-w-0 max-w-full truncate font-mono text-xs", className)}
      {...props}
    >
      {children}
    </span>
  )
}

/// First cell of a resource row: the display name over its identifier.
function TableTitleCell({
  title,
  subtitle,
  className,
  ...props
}: Omit<ComponentProps<"td">, "align"> & { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <TD className={cn("max-w-72", className)} {...props}>
      <div className="grid min-w-0 gap-0.5">
        <span className="block min-w-0 truncate font-medium">{title}</span>
        {subtitle != null && subtitle !== "" && <IdText className="text-fg-muted">{subtitle}</IdText>}
      </div>
    </TD>
  )
}

/// Trailing cell for row actions, sized to its buttons.
function TableActionsCell({ className, ...props }: Omit<ComponentProps<"td">, "align">) {
  return <TD className={cn("w-0 whitespace-nowrap text-right", className)} {...props} />
}

export { IdText, TableActionsCell, TableCard, TableTitleCell }

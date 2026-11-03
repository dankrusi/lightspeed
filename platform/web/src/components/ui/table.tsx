import type { ComponentProps, ReactNode } from "react"
import { Table as WhisperinkTable } from "@versavolta/whisperink/components/Table/Table.js"
import { TBody } from "@versavolta/whisperink/components/Table/TBody.js"
import { TD } from "@versavolta/whisperink/components/Table/TD.js"
import { TH } from "@versavolta/whisperink/components/Table/TH.js"
import { THead } from "@versavolta/whisperink/components/Table/THead.js"
import { TR } from "@versavolta/whisperink/components/Table/TR.js"
import { cn } from "@/lib/utils"

function TableCard({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="table-card" className={cn("min-w-0 max-w-full overflow-hidden rounded-[var(--card-radius)] border border-border", className)} {...props} />
}

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

function Table(props: ComponentProps<"table">) {
  return <WhisperinkTable data-slot="table" {...props} />
}

function TableHeader(props: ComponentProps<"thead">) {
  return <THead data-slot="table-header" {...props} />
}

function TableBody(props: ComponentProps<"tbody">) {
  return <TBody data-slot="table-body" {...props} />
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("border-t border-border font-medium", className)} {...props} />
}

function TableRow(props: ComponentProps<"tr">) {
  return <TR data-slot="table-row" {...props} />
}

function TableHead({ align: _align, ...props }: ComponentProps<"th">) {
  return <TH data-slot="table-head" {...props} />
}

function TableCell({ align: _align, ...props }: ComponentProps<"td">) {
  return <TD data-slot="table-cell" {...props} />
}

function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-4 text-sm text-fg-muted", className)} {...props} />
}

function TableTitleCell({
  title,
  subtitle,
  className,
  ...props
}: ComponentProps<"td"> & { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <TableCell className={cn("max-w-72", className)} {...props}>
      <div className="grid min-w-0 gap-0.5">
        <span className="block min-w-0 truncate font-medium">{title}</span>
        {subtitle != null && subtitle !== "" && <IdText className="text-fg-muted">{subtitle}</IdText>}
      </div>
    </TableCell>
  )
}

function TableActionsCell({ className, ...props }: ComponentProps<"td">) {
  return <TableCell className={cn("w-0 whitespace-nowrap text-right", className)} {...props} />
}

export {
  IdText,
  Table,
  TableActionsCell,
  TableBody,
  TableCaption,
  TableCard,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableTitleCell,
}

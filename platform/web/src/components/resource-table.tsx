import { useRef, type ReactNode } from "react";
import { CaretRight, CircleNotch } from "@phosphor-icons/react";
import { Badge } from "@versavolta/whisperink/components/Badge/Badge.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Table } from "@versavolta/whisperink/components/Table/Table.js";
import { TableActionsCell, TableCard } from "@/components/table-layout";
import { TBody } from "@versavolta/whisperink/components/Table/TBody.js";
import { TD } from "@versavolta/whisperink/components/Table/TD.js";
import { TH } from "@versavolta/whisperink/components/Table/TH.js";
import { THead } from "@versavolta/whisperink/components/Table/THead.js";
import { TR } from "@versavolta/whisperink/components/Table/TR.js";
import type { ResourceStatusInfo } from "@/lib/resource-status";
import { cn } from "@/lib/utils";

/** Inventory rows share their hierarchy and interaction; columns keep their domain meaning. */
export function ResourceTable({ label, columns, children }: {
  label: string;
  columns: string[];
  children: ReactNode;
}) {
  return (
    <TableCard>
      <Table aria-label={label} className="[&_td]:px-3 [&_td]:py-3 [&_th]:px-3">
        <THead>
          <TR>
            {columns.map((column, index) => <TH key={column} scope="col"
              className={index > 0 && index < columns.length - 1 ? "hidden sm:table-cell" : undefined}>{column}</TH>)}
            <TH scope="col" className="w-0"><span className="sr-only">Details</span></TH>
          </TR>
        </THead>
        <TBody>{children}</TBody>
      </Table>
    </TableCard>
  );
}

export function ResourceRow({ name, onOpen, children }: {
  name: string;
  onOpen: (trigger: HTMLButtonElement | null) => void;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <TR className="cursor-pointer focus-within:bg-muted/50" onClick={() => onOpen(triggerRef.current)}>
      {children}
      <TableActionsCell>
        <IconButton ref={triggerRef} size="sm" className="text-muted-foreground"
          label={`Details for ${name}`} aria-haspopup="dialog">
          <CaretRight aria-hidden="true" className="size-4" />
        </IconButton>
      </TableActionsCell>
    </TR>
  );
}

export function ResourceIdentityCell({ name, subtitle, mono = false, icon, compactDescription }: {
  name: string;
  subtitle?: string;
  mono?: boolean;
  icon?: ReactNode;
  compactDescription?: string;
}) {
  const secondary = subtitle?.trim().toLocaleLowerCase() !== name.trim().toLocaleLowerCase() ? subtitle : undefined;
  return (
    <TD className="max-w-40 sm:max-w-72">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <span aria-hidden="true" className="shrink-0">{icon}</span>}
        <div className="grid min-w-0 gap-0.5">
          <span className="truncate font-medium" title={name}>{name}</span>
          {secondary && <span className={cn("truncate text-xs text-muted-foreground", mono && "font-mono", compactDescription && "hidden sm:block")} title={secondary}>{secondary}</span>}
          {compactDescription && <span className="truncate text-xs text-muted-foreground sm:hidden" title={compactDescription}>{compactDescription}</span>}
        </div>
      </div>
    </TD>
  );
}

export function ResourceValue({ children, description, mono = false }: {
  children: string;
  description?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-0.5 text-muted-foreground">
      <span className={cn("truncate", mono && "font-mono text-xs")} title={children}>{children}</span>
      {description && <span className="truncate text-xs" title={description}>{description}</span>}
    </div>
  );
}

export function ResourceStatusBadge({ status }: { status: ResourceStatusInfo }) {
  return (
    <Badge outline={status.tone !== "positive"} className={cn(
      status.tone === "warning" && "border-amber-600/35 text-amber-700 dark:text-amber-400",
      status.tone === "danger" && "border-destructive/50 text-destructive",
      status.tone === "neutral" && "text-muted-foreground",
    )}>
      {status.tone === "pending" && <CircleNotch aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
      {status.label}
    </Badge>
  );
}

export function ResourceStatus({ status }: { status: ResourceStatusInfo }) {
  return (
    <div className="grid gap-1">
      <ResourceStatusBadge status={status} />
      {status.description && <p className="max-w-56 whitespace-normal text-xs text-muted-foreground">{status.description}</p>}
    </div>
  );
}

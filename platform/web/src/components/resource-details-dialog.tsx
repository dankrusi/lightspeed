import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { cn } from "@/lib/utils";

export function ResourceDetailsDialog({ open, onOpenChange, title, description, finalFocus, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Element to focus once the dialog closes, when its opener may no longer hold focus. */
  finalFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  // Modal restores focus in its own effect cleanup, which runs before this
  // effect; restoring here takes precedence over it.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) finalFocus?.current?.focus();
    wasOpen.current = open;
  }, [open, finalFocus]);
  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={title} description={description} size="lg">
      {/* Opening focuses the details themselves rather than their first action. */}
      <div data-autofocus tabIndex={-1} className="grid gap-6 outline-none">{children}</div>
    </Modal>
  );
}

export function ResourceDetailsGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

export function ResourceDetail({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 break-words text-sm [overflow-wrap:anywhere]", mono && "font-mono text-xs")}>{children}</dd>
    </div>
  );
}

export function ResourceActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-t pt-4">{children}</div>;
}

import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "@versavolta/whisperink/components/Modal/ConfirmDialog.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";

/// Destructive action with a confirmation step, shared by model provider and
/// GitHub App details. `onConfirm` may return a promise to keep the dialog
/// open, showing progress and any failure, until the action settles.
export function ConfirmDangerButton({
  label,
  title,
  description,
  pending,
  onConfirm,
}: {
  label: string;
  title: string;
  description: ReactNode;
  pending?: boolean;
  onConfirm: () => void | Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  // A plain sentence describes the dialog; one with markup (an id in code
  // type, say) keeps it by being shown in the body instead.
  const plain = typeof description === "string";
  return (
    <>
      <Button variant="outline" size="sm" className="text-destructive" disabled={pending} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        title={title}
        description={plain ? description : undefined}
        confirmLabel={label}
      >
        {plain ? null : <p className="text-sm text-muted-foreground">{description}</p>}
      </ConfirmDialog>
    </>
  );
}

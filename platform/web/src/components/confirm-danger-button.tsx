import { useState, type ReactNode } from "react";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";

/// Destructive action with a confirmation step, shared by model provider and
/// GitHub App details.
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
  onConfirm: () => void;
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
      <Modal
        role="alertdialog"
        size="sm"
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={plain ? description : undefined}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {label}
            </Button>
          </>
        }
      >
        {plain ? null : <p className="text-sm text-muted-foreground">{description}</p>}
      </Modal>
    </>
  );
}

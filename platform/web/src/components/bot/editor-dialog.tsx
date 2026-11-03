import type { ReactNode } from "react";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";

/** The wide dialog that bot creation and bot settings are edited in. */
export function BotEditorDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={title} description={description} size="xl" footer={footer}>
      {children}
    </Modal>
  );
}

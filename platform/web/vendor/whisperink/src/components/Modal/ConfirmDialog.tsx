import { type ReactNode, useEffect, useRef, useState } from "react";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Button } from "../Button/Button.js";
import { Modal } from "./Modal.js";

/**
 * The question before an action that can't be taken back: a title that asks
 * it, a sentence on what happens, Cancel first and the action on the right.
 *
 * `onConfirm` may return a promise. While it runs the action shows progress
 * and the dialog can't be dismissed; when it resolves the dialog closes, and
 * when it rejects the dialog stays open with the reason, ready to try again.
 * A handler that returns nothing closes the dialog straight away.
 * @category overlays
 */
export function ConfirmDialog({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  confirmDisabled = false,
}: ({
  open: boolean;
  onClose: () => void;
  /** Runs the action. Return its promise to keep the dialog open until it settles. */
  onConfirm: () => void | Promise<unknown>;
  /** The question, e.g. "Delete this quote?". */
  title: string;
  /** One sentence on what happens. */
  description?: string;
  /** What is affected in more detail, or a field to type a name into. */
  children?: ReactNode;
  /** The action as a verb, e.g. "Delete quote". */
  confirmLabel: string;
  /** Defaults to the kit's "Cancel". */
  cancelLabel?: string;
  /** "danger" for what destroys or removes; "primary" for what is weighty but not destructive, like sending. */
  tone?: "danger" | "primary";
  /** Holds the action back, e.g. until a typed name matches. */
  confirmDisabled?: boolean;
}) & UiMetadataProps) {
  const _ui = uiMetadata("confirm-dialog", "Confirm or cancel an action", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A caller may unmount the dialog while its action is still running. Set on
  // every mount, since StrictMode mounts, unmounts and mounts again.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const close = useRef(onClose);
  close.current = onClose;
  // Each opening is a new question: no failure left over from the last one.
  useEffect(() => {
    if (open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const reason = (thrown: unknown) =>
    (thrown instanceof Error ? thrown.message : typeof thrown === "string" ? thrown : "").trim() || text.error.generic;

  const confirm = () => {
    setError(null);
    let result: void | Promise<unknown>;
    try {
      result = onConfirm();
    } catch (thrown) {
      setError(reason(thrown));
      return;
    }
    if (!result || typeof result.then !== "function") {
      onClose();
      return;
    }
    setBusy(true);
    result.then(
      () => {
        if (!mounted.current) return;
        setBusy(false);
        close.current();
      },
      (thrown: unknown) => {
        if (!mounted.current) return;
        setBusy(false);
        setError(reason(thrown));
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      role="alertdialog"
      size="sm"
      title={title}
      description={description}
      dismissible={!busy}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>{cancelLabel ?? text.actions.cancel}</Button>
          <Button variant={tone} onClick={confirm} loading={busy} disabled={confirmDisabled}>{confirmLabel}</Button>
        </>
      } {..._ui.props}
    >
      {(children || error) && (
        <div className="grid gap-3">
          {children}
          {error && <p role="alert" className="text-sm text-danger-fg">{error}</p>}
        </div>
      )}
    </Modal>
  );
}

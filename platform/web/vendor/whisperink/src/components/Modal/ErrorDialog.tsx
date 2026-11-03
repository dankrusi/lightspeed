import { type ReactNode, useEffect, useState } from "react";
import { cn } from "../../cn.js";
import { CaretRight, XCircle } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Button } from "../Button/Button.js";
import { CodeBlock } from "../CodeBlock/CodeBlock.js";
import { Modal } from "./Modal.js";

/** One named thing that went wrong — a form field, a row, an uploaded file. */
export type ErrorCause = { label: string; message: string; hint?: string };

/**
 * The dialog an application shows when an action failed: a short sentence
 * naming the failure, the reason underneath, the individual causes it can point
 * at, and a details pane holding the full diagnostic text behind one toggle.
 *
 * The kit only presents what it is handed — assembling `details` (stack traces,
 * identifiers, logs) is the application's job.
 * @category overlays
 */
export function ErrorDialog({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  open,
  onClose,
  title,
  message,
  causes = [],
  causesLabel,
  details,
  detailsLanguage,
  actions,
  size = "md",
  inline = false,
  defaultShowDetails = false,
}: ({
  open: boolean;
  onClose: () => void;
  /** Short sentence stating what is wrong, e.g. "Saving failed". */
  title: string;
  message?: ReactNode;
  causes?: readonly ErrorCause[];
  /** Heading above the causes; defaults to the kit's wording. */
  causesLabel?: string;
  /** Full diagnostic text, revealed behind the details toggle and copyable. */
  details?: string;
  detailsLanguage?: string;
  /** Extra buttons beside Close, e.g. a retry. */
  actions?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Renders inside the parent (for documentation) instead of the document body. */
  inline?: boolean;
  /** Starts with the details pane open, for documentation and screenshots. */
  defaultShowDetails?: boolean;
}) & UiMetadataProps) {
  const _ui = uiMetadata("error-dialog", "Explain an error", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const [showDetails, setShowDetails] = useState(defaultShowDetails);
  // Each failure opens its own conversation: never inherit the previous one's
  // expanded details.
  useEffect(() => {
    if (!open) setShowDetails(defaultShowDetails);
  }, [open, defaultShowDetails]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      role="alertdialog"
      inline={inline}
      footer={
        <>
          {details !== undefined && (
            <Button variant="ghost" onClick={() => setShowDetails((value) => !value)} aria-expanded={showDetails} className="mr-auto">
              <CaretRight className={cn("transition-transform", showDetails && "rotate-90")} aria-hidden="true" />
              {showDetails ? text.error.hideDetails : text.error.details}
            </Button>
          )}
          {actions}
          <Button variant="secondary" onClick={onClose} data-autofocus>{text.actions.close}</Button>
        </>
      } {..._ui.props}
    >
      <div className="grid gap-4">
        <div className="flex gap-3">
          <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <div className="min-w-0 text-sm text-fg-muted">{message}</div>
        </div>
        {causes.length > 0 && (
          <div className="rounded-[var(--alert-radius)] border border-danger/25 bg-danger-soft p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-danger-fg">{causesLabel ?? text.error.causes}</p>
            <ul className="mt-2 grid gap-1.5">
              {causes.map((cause) => (
                <li key={`${cause.label}-${cause.message}`} className="text-sm">
                  <span className="font-medium text-fg">{cause.label}</span>
                  <span className="text-fg-muted"> — {cause.message}</span>
                  {cause.hint && <span className="block font-mono text-2xs text-fg-subtle">{cause.hint}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {showDetails && details !== undefined && (
          <CodeBlock code={details} language={detailsLanguage ?? text.error.report} className="max-h-80 overflow-y-auto" />
        )}
      </div>
    </Modal>
  );
}

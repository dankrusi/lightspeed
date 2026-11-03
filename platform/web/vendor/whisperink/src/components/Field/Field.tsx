import { type ReactNode, useId } from "react";
import { cn } from "../../cn.js";
import { Question } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Tooltip } from "../Tooltip/Tooltip.js";

/** What `Field` hands its control; `control` is the same wiring ready to spread. */
type FieldContext = {
  id: string;
  invalid: boolean;
  describedBy?: string;
  control: { id: string; "aria-describedby"?: string; "aria-invalid"?: true; "aria-required"?: true };
};

/**
 * Field wires label, help, hint, and error to its control through ids so
 * assistive technology reads them, and shows a required marker consistently.
 *
 * The simplest way to connect a control is to spread what the field hands it:
 * `{(field) => <Input {...field.control} />}` carries the id, the description,
 * the invalid state and the required state in one go, and an invalid control
 * styles itself from `aria-invalid`.
 * @category forms
 */
export function Field({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  label,
  hint,
  error,
  help,
  required,
  optional,
  className,
  children,
  id: explicitId,
}: ({
  id?: string;
  label: string;
  /** Persistent guidance under the control. It stays when an error appears: how to get it right matters most then. */
  hint?: ReactNode;
  error?: string;
  /** Longer explanation behind a help button; shown in a tooltip, so keep it text. */
  help?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: (field: FieldContext) => ReactNode;
}) & UiMetadataProps) {
  const _ui = uiMetadata("field", "Label and explain a form control", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  // Packed to the top so a taller neighbour in a row of fields does not
  // stretch the label away from its control; min-w-0 lets long values
  // truncate inside a grid or flex track instead of widening the form.
  return (
    <div className={cn("grid min-w-0 content-start gap-1.5", className)} {..._ui.attributes}>
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
        </label>
        {optional && <span className="text-xs text-fg-subtle">{text.field.optional}</span>}
        {help && (
          <Tooltip content={help} pinOnClick>
            <button type="button" className="focus-ring -m-1 grid size-6 place-items-center rounded-full text-fg-subtle hover:text-fg" aria-label={text.field.helpFor(label)}>
              <Question className="size-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
      {children({
        id,
        invalid: Boolean(error),
        describedBy,
        control: { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, "aria-required": required ? true : undefined },
      })}
      {error && <p id={errorId} role="alert" className="text-xs text-danger-fg">{error}</p>}
      {hint && <p id={hintId} className="text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}

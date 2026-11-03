import { useState } from "react";
import { cn } from "../../cn.js";
import { UploadSimple } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/** Whether a file is one of the kinds an `accept` list names: an extension, a MIME type, or a `type/*` family. */
function accepts(file: File, accept: string | undefined): boolean {
  const rules = (accept ?? "").split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule);
}

/**
 * File drop zone that is also a file picker. `accept` holds for dropped files
 * as well as picked ones: what does not match is left out, said so in the zone
 * itself, and handed to `onReject` for anything more the application wants to do.
 * @category forms
 */
export function Dropzone({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  label,
  hint,
  file,
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  onReject,
  className,
}: ({
  label?: string;
  hint?: string;
  /** Name of the currently attached file, shown instead of the label. */
  file?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles?: (files: File[]) => void;
  /** Dropped files that `accept` does not allow. */
  onReject?: (files: File[]) => void;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("dropzone", "Choose or drop files", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const [active, setActive] = useState(false);
  const [rejected, setRejected] = useState(0);
  const emit = (list: FileList | null) => {
    const all = list ? [...list] : [];
    const allowed = all.filter((entry) => accepts(entry, accept));
    const refused = all.filter((entry) => !accepts(entry, accept));
    setRejected(refused.length);
    if (refused.length) onReject?.(refused);
    if (allowed.length) onFiles?.(multiple ? allowed : [allowed[0]]);
  };
  return (
    <label
      aria-disabled={disabled || undefined}
      onDragOver={(event) => { if (disabled) return; event.preventDefault(); setActive(true); }}
      // Crossing onto the icon or the text inside is not leaving the zone.
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(false); }}
      onDrop={(event) => { event.preventDefault(); setActive(false); if (!disabled) emit(event.dataTransfer.files); }}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[rgb(var(--ring))] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface",
        active ? "border-primary bg-subtle" : rejected ? "border-danger" : "border-border-strong hover:bg-subtle/60",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )} {..._ui.attributes}
    >
      {/* Keep the hidden input inside the dropzone when the browser scrolls it into focus. */}
      <input type="file" className="sr-only" accept={accept} multiple={multiple} disabled={disabled} onChange={(event) => { emit(event.target.files); event.target.value = ""; }} />
      <span className="grid size-9 place-items-center rounded-full bg-subtle text-fg-muted"><UploadSimple className="size-4" /></span>
      <span className="text-sm font-medium">{file ?? label ?? text.dropzone.label}</span>
      {hint && <span className="text-xs text-fg-muted">{hint}</span>}
      <span role="alert" className="text-xs text-danger-fg empty:hidden">{rejected > 0 ? text.dropzone.rejected(rejected) : null}</span>
    </label>
  );
}

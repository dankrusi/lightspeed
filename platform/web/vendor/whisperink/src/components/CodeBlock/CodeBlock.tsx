import { useState } from "react";
import { cn } from "../../cn.js";
import { Check, Copy } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";

/**
 * Block of source code with a language label and a copy button.
 * There is no syntax highlighting.
 * @category content
 */
export function CodeBlock({ uiId, uiDescription, uiComponentId, uiComponentDescription, code, language, className }: ({ code: string; language?: string; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("code-block", "Display formatted source code", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const [copied, setCopied] = useState(false);
  // "Copied" is only said once the clipboard has actually taken it.
  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }, () => undefined);
  };
  return (
    <div className={cn("overflow-hidden rounded-md border border-border bg-subtle/60", className)} {..._ui.attributes}>
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{language ?? "Text"}</span>
        <IconButton label={copied ? text.code.copied : text.code.copy} size="sm" onClick={copy} className="size-7">{copied ? <Check className="text-success" /> : <Copy />}</IconButton>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-3 font-mono text-xs leading-5 text-fg"><code>{code}</code></pre>
    </div>
  );
}

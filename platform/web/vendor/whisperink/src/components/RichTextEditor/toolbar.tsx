import { useState } from "react";
import { cn } from "../../cn.js";
import { ArrowClockwise, ArrowCounterClockwise, Code, CodeBlock, Eraser, Image, LinkSimple, ListBullets, ListNumbers, Minus, Paragraph, Quotes, TextB, TextHOne, TextHThree, TextHTwo, TextItalic, TextStrikethrough } from "../../icons.js";
import { IconButton } from "../Button/IconButton.js";
import type { RichTextElement } from "./codec.js";

export type RichTextTool = "undo" | "redo" | "paragraph" | "heading1" | "heading2" | "heading3" | "bold" | "italic" | "strike" | "bulletList" | "orderedList" | "quote" | "link" | "image" | "inlineCode" | "codeBlock" | "rule" | "clear";
export const richTextToolbar: readonly (readonly RichTextTool[])[] = [
  ["undo", "redo"], ["paragraph", "heading1", "heading2", "heading3"], ["bold", "italic", "strike"],
  ["bulletList", "orderedList", "quote"], ["link", "image"], ["inlineCode", "codeBlock", "rule", "clear"],
];
export const toolElements: Partial<Record<RichTextTool, RichTextElement>> = {
  heading1: "h1", heading2: "h2", heading3: "h3", bold: "strong", italic: "em", strike: "s", bulletList: "ul", orderedList: "ol", quote: "blockquote", link: "a", image: "img", inlineCode: "code", codeBlock: "pre", rule: "hr",
};
const icons = { undo: ArrowCounterClockwise, redo: ArrowClockwise, paragraph: Paragraph, heading1: TextHOne, heading2: TextHTwo, heading3: TextHThree, bold: TextB, italic: TextItalic, strike: TextStrikethrough, bulletList: ListBullets, orderedList: ListNumbers, quote: Quotes, link: LinkSimple, image: Image, inlineCode: Code, codeBlock: CodeBlock, rule: Minus, clear: Eraser };

export function RichTextToolbar({ groups, labels, label, active, disabled, unavailable, onAction, onFocusEditor }: {
  groups: readonly (readonly RichTextTool[])[];
  labels: Record<RichTextTool, string>;
  label: string;
  active: ReadonlySet<RichTextTool>;
  disabled: boolean;
  unavailable: ReadonlySet<RichTextTool>;
  onAction: (tool: RichTextTool) => void;
  onFocusEditor: () => void;
}) {
  const [focused, setFocused] = useState<RichTextTool | null>(null);
  const enabled = groups.flat().filter((tool) => !unavailable.has(tool));
  const tabStop = focused && enabled.includes(focused) ? focused : enabled[0];
  return <div role="toolbar" aria-label={label} aria-orientation="horizontal" className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border p-2" onKeyDown={(event) => {
    if (event.key === "Escape") { event.preventDefault(); onFocusEditor(); return; }
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault(); buttons[next]?.focus();
  }}>
    {groups.filter((group) => group.length).map((group, index) => <div key={index} className={cn("flex items-center gap-0.5", index > 0 && "border-l border-border pl-2")}>
      {group.map((tool) => {
        const Icon = icons[tool];
        return <IconButton key={tool} label={labels[tool]} disabled={disabled || unavailable.has(tool)} tabIndex={tool === tabStop ? 0 : -1}
          aria-pressed={["undo", "redo", "image", "rule", "clear"].includes(tool) ? undefined : active.has(tool)}
          className={active.has(tool) ? "bg-subtle text-fg" : "text-fg-muted"}
          onFocus={() => setFocused(tool)} onMouseDown={(event) => event.preventDefault()} onClick={() => onAction(tool)}><Icon aria-hidden="true" /></IconButton>;
      })}
    </div>)}
  </div>;
}

import { type ComponentProps, type KeyboardEvent, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { Code, TextAa } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { useText, type WhisperinkText } from "../../text.js";
import { Button } from "../Button/Button.js";
import { Field } from "../Field/Field.js";
import { Input } from "../Input/Input.js";
import { Modal } from "../Modal/Modal.js";
import { Segmented } from "../Tabs/Segmented.js";
import { Textarea } from "../Textarea/Textarea.js";
import { cleanRichTextHtml, escapeRichText, type RichTextElement, richTextElements, richTextHtmlToMarkdown, richTextMarkdownToHtml, richTextUrl } from "./codec.js";
import { type EditorSnapshot, RichTextHistory, type RichTextMode } from "./history.js";
import { readRichTextSelection, restoreRichTextSelection, restoreTextSelection, type RichTextSelection, textSelection } from "./selection.js";
import { type RichTextTool, richTextToolbar, RichTextToolbar, toolElements } from "./toolbar.js";

/** Replaces parts of the editor's copy; the rest comes from the kit's text (`WhisperinkText["richText"]`). */
export type RichTextEditorLabels = Omit<Partial<WhisperinkText["richText"]>, "tools"> & { tools?: Partial<Record<RichTextTool, string>> };
export type RichTextEditorProps = (Omit<ComponentProps<"div">, "children" | "onChange" | "onInput" | "defaultValue" | "contentEditable" | "dangerouslySetInnerHTML"> & {
  /** Controlled Markdown value. Raw HTML in Markdown is treated as text. */
  value: string;
  onChange: (markdown: string, document: { html: string }) => void;
  /** Semantic allowlist, enforced in every mode and on paste. Paragraphs/br and list items are structural. */
  elements?: readonly RichTextElement[];
  /** Ordered button groups. Empty hides formatting tools; omitted uses all supported tools. */
  toolbar?: readonly (readonly RichTextTool[])[];
  modes?: readonly RichTextMode[];
  defaultMode?: RichTextMode;
  onModeChange?: (mode: RichTextMode) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** Maximum length of the stored Markdown, including markup. Oversized edits are rejected as one undoable unit. */
  maxLength?: number;
  /** A hidden input makes the Markdown available in native FormData. */
  name?: string;
  labels?: RichTextEditorLabels;
  /** Sizing of both the formatted surface and source textarea. */
  editorClassName?: string;
}) & UiMetadataProps;

const defaultModes: readonly RichTextMode[] = ["visual", "markdown", "html"];
const prose = "[&_p]:my-3 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li>p]:my-1 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:text-fg-muted [&_a]:underline [&_a]:underline-offset-2 [&_img]:my-3 [&_img]:max-h-96 [&_img]:max-w-full [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:rounded [&_pre]:bg-subtle [&_pre]:p-3 [&_code]:rounded [&_code]:bg-subtle [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm [&_pre_code]:p-0 [&_hr]:my-5 [&_hr]:border-border [&>:first-child]:mt-0 [&>:last-child]:mb-0";

/**
 * Unbranded, Markdown-backed editing with formatted, Markdown and bare HTML views.
 * The browser owns the live contenteditable DOM; React never rewrites it on a normal keystroke.
 * Sanitization happens at input boundaries and serialization, not by disturbing the user's caret.
 * @category forms
 */
export function RichTextEditor({ uiId, uiDescription, uiComponentId, uiComponentDescription, value, onChange, elements = richTextElements, toolbar = richTextToolbar, modes = defaultModes, defaultMode = "visual", onModeChange,
  label, placeholder, disabled = false, readOnly = false, invalid = false, maxLength, name, labels, editorClassName, className, id: explicitId,
  "aria-describedby": describedBy, "aria-labelledby": labelledBy, "aria-invalid": ariaInvalid, ...props }: (RichTextEditorProps) & UiMetadataProps) {
  const _ui = uiMetadata("rich-text-editor", "Edit formatted text", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const kit = useText().richText;
  const text = { ...kit, ...labels, tools: { ...kit.tools, ...labels?.tools } };
  const generatedId = useId(), id = explicitId ?? generatedId, hintId = `${id}-rich-text-hint`, statusId = `${id}-rich-text-status`, dialogForm = `${id}-rich-text-insert`;
  const permittedModes = modes.length ? modes : defaultModes;
  const firstMode = permittedModes[0]!;
  const [view, setView] = useState<RichTextMode>(permittedModes.includes(defaultMode) ? defaultMode : firstMode);
  const mode = permittedModes.includes(view) ? view : firstMode;
  const [source, setSource] = useState(value), [, refresh] = useState(0), [message, setMessage] = useState(""), [visuallyEmpty, setVisuallyEmpty] = useState(!value);
  const [active, setActive] = useState<Set<RichTextTool>>(new Set());
  const [dialog, setDialog] = useState<{ kind: "link" | "image"; url: string; text: string; error?: string } | null>(null);
  const visual = useRef<HTMLDivElement>(null), raw = useRef<HTMLTextAreaElement>(null), container = useRef<HTMLDivElement>(null);
  const model = useRef(value), incoming = useRef(value), config = elements.join("|"), previousConfig = useRef(config), mountedMode = useRef<RichTextMode | null>(null);
  const selection = useRef<RichTextSelection | null>(null), dialogNode = useRef<Element | null>(null);
  const history = useRef(new RichTextHistory()), before = useRef<EditorSnapshot | null>(null), last = useRef<EditorSnapshot | null>(null), pending = useRef<EditorSnapshot | null>(null);
  const composing = useRef(false), mutating = useRef(false), inputKind = useRef("command");
  const focusNextView = useRef(false), keyboardViewSwitch = useRef(false);
  const locked = disabled || readOnly;
  const groups = useMemo(() => toolbar.map((group) => group.filter((tool) => !toolElements[tool] || elements.includes(toolElements[tool]!))).filter((group) => group.length), [toolbar, config]);

  function snapshot(): EditorSnapshot {
    return { mode, markdown: model.current, html: visual.current?.innerHTML ?? richTextMarkdownToHtml(model.current, elements), source: raw.current?.value ?? source,
      selection: visual.current ? readRichTextSelection(visual.current) ?? selection.current : null,
      sourceSelection: raw.current ? [raw.current.selectionStart, raw.current.selectionEnd, raw.current.selectionDirection] : null };
  }
  function publish(markdown: string) {
    if (model.current === markdown) return;
    model.current = markdown;
    onChange(markdown, { html: richTextMarkdownToHtml(markdown, elements) });
  }
  function restore(entry: EditorSnapshot, notify = true) {
    if (notify) publish(entry.markdown); else model.current = entry.markdown;
    pending.current = entry; mountedMode.current = null;
    setView(entry.mode); if (entry.mode !== mode) onModeChange?.(entry.mode); setSource(entry.source); refresh((n) => n + 1);
  }
  function undo(redo = false) {
    if (locked || composing.current) return;
    const entry = redo ? history.current.redo() : history.current.undo();
    if (entry) { setMessage(""); restore(entry); }
  }
  function commit(previous: EditorSnapshot, kind = "command") {
    if (visual.current) setVisuallyEmpty(!visual.current.textContent && !visual.current.querySelector("img, hr"));
    const current = snapshot();
    const html = mode === "visual" ? current.html : mode === "html" ? current.source : richTextMarkdownToHtml(current.source, elements);
    const markdown = richTextHtmlToMarkdown(html, elements);
    if (maxLength !== undefined && markdown.length > maxLength) { setMessage(text.limit(maxLength)); restore(previous, false); return; }
    setMessage(""); publish(markdown);
    current.markdown = markdown;
    if (mode !== "visual") setSource(current.source);
    history.current.push(previous, current, kind);
    last.current = current; before.current = null;
    refresh((n) => n + 1);
  }
  function focusEditor() {
    if (mode === "visual" && visual.current) restoreRichTextSelection(visual.current, selection.current);
    else raw.current?.focus();
  }

  useLayoutEffect(() => {
    const external = incoming.current !== value || previousConfig.current !== config;
    if (external) {
      const changed = model.current !== value || previousConfig.current !== config;
      incoming.current = value; previousConfig.current = config;
      if (changed) {
        model.current = value; history.current.clear(); selection.current = null; pending.current = null; mountedMode.current = null;
        before.current = null; composing.current = false; setDialog(null); setMessage("");
      }
    }
    if (mountedMode.current !== mode || pending.current) {
      const entry = pending.current;
      const html = entry?.html ?? richTextMarkdownToHtml(model.current, elements);
      if (visual.current) {
        visual.current.innerHTML = html || "<p><br></p>";
        setVisuallyEmpty(!visual.current.textContent && !visual.current.querySelector("img, hr"));
        if (entry) { selection.current = entry.selection; restoreRichTextSelection(visual.current, entry.selection); }
      }
      const nextSource = entry?.source ?? (mode === "html" ? html.replace(/<\/(p|h[1-6]|ul|ol|blockquote|pre)>/g, "</$1>\n").trim() : model.current);
      setSource(nextSource);
      if (raw.current) {
        raw.current.value = nextSource;
        if (entry?.sourceSelection) { raw.current.focus(); raw.current.setSelectionRange(...entry.sourceSelection); }
      }
      pending.current = null; mountedMode.current = mode; last.current = snapshot();
      if (focusNextView.current) {
        focusNextView.current = false;
        if (visual.current) { selection.current = null; restoreRichTextSelection(visual.current, null); }
        else raw.current?.focus();
      }
    }
  });

  function updateSelection() {
    const root = visual.current;
    if (!root) return;
    const bookmark = readRichTextSelection(root);
    if (!bookmark) return;
    selection.current = bookmark;
    const selected = document.getSelection()?.anchorNode;
    let node = selected instanceof Element ? selected : selected?.parentElement;
    const tags = new Set<string>();
    while (node && node !== root) { tags.add(node.localName); node = node.parentElement; }
    if (tags.has("b")) tags.add("strong"); if (tags.has("i")) tags.add("em"); if (tags.has("strike")) tags.add("s");
    const tools = new Set<RichTextTool>(Object.entries(toolElements).filter(([, tag]) => tags.has(tag)).map(([tool]) => tool as RichTextTool));
    for (const [tool, command] of [["bold", "bold"], ["italic", "italic"], ["strike", "strikeThrough"]] as const) {
      if (document.queryCommandState(command)) tools.add(tool);
    }
    if (!tags.has("pre") && !["h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].some((tag) => tags.has(tag))) tools.add("paragraph");
    setActive((current) => current.size === tools.size && [...tools].every((tool) => current.has(tool)) ? current : tools);
  }
  useEffect(() => {
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, []);
  useEffect(() => {
    if (mode !== "visual" || disabled) return;
    // A contenteditable DIV is not labelable in HTML. Keep Field's click-to-focus behaviour.
    const labels = Array.from(document.querySelectorAll("label")).filter((label) => label.htmlFor === id);
    labels.forEach((label) => label.addEventListener("click", focusEditor));
    return () => labels.forEach((label) => label.removeEventListener("click", focusEditor));
  }, [id, mode, disabled]);

  // Native beforeinput covers keyboard, context-menu undo, mobile and accessibility editing.
  useEffect(() => {
    const node = mode === "visual" ? visual.current : raw.current;
    const handle = (event: Event) => {
      const input = event as InputEvent;
      if (mutating.current || composing.current) return;
      if (locked) { event.preventDefault(); return; }
      if (input.inputType === "historyUndo" || input.inputType === "historyRedo") { event.preventDefault(); undo(input.inputType === "historyRedo"); return; }
      const formatting: Record<string, RichTextElement | null> = { formatBold: "strong", formatItalic: "em", formatStrikeThrough: "s", formatUnderline: null, formatJustifyCenter: null, formatJustifyRight: null, formatJustifyFull: null, formatFontColor: null, formatBackColor: null, formatFontName: null };
      if (input.inputType in formatting && (!formatting[input.inputType] || !elements.includes(formatting[input.inputType]!))) { event.preventDefault(); return; }
      before.current = snapshot(); inputKind.current = input.inputType;
    };
    node?.addEventListener("beforeinput", handle);
    return () => node?.removeEventListener("beforeinput", handle);
  });

  function changeMode(next: RichTextMode) {
    if (next === mode || composing.current) return;
    setMessage(""); focusNextView.current = !keyboardViewSwitch.current; setView(next); onModeChange?.(next);
  }
  function mutate(action: () => void, preserveTextSelection = false) {
    if (locked || mode !== "visual" || !visual.current || composing.current) return;
    focusEditor();
    const previous = snapshot();
    const offsets = preserveTextSelection ? textSelection(visual.current) : null;
    const previousText = visual.current.textContent;
    mutating.current = true;
    try { action(); } finally { mutating.current = false; }
    if (offsets && previous.html !== visual.current.innerHTML && previousText === visual.current.textContent) restoreTextSelection(visual.current, offsets);
    selection.current = readRichTextSelection(visual.current);
    commit(previous);
    updateSelection();
  }
  function command(name: string, argument?: string) {
    // Native commands handle split selections, list editing and active typing marks. Export never trusts their HTML.
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(name, false, argument);
  }
  function openInsert(kind: "link" | "image", target?: Element) {
    if (locked || mode !== "visual") return;
    focusEditor();
    const range = document.getSelection()?.getRangeAt(0);
    const anchor = range?.startContainer instanceof Element ? range.startContainer : range?.startContainer.parentElement;
    const found = target ?? (kind === "link" ? anchor?.closest("a") : range?.startContainer.childNodes[range.startOffset]);
    dialogNode.current = found instanceof Element && visual.current?.contains(found) && found.localName === (kind === "link" ? "a" : "img") ? found : null;
    setDialog({ kind, url: dialogNode.current?.getAttribute(kind === "link" ? "href" : "src") ?? "", text: kind === "image" ? dialogNode.current?.getAttribute("alt") ?? "" : dialogNode.current?.textContent ?? range?.toString() ?? "" });
  }
  function closeDialog() { setDialog(null); requestAnimationFrame(focusEditor); }
  function applyInsert(remove = false) {
    if (!dialog || locked) return;
    const url = richTextUrl(dialog.url, dialog.kind === "image");
    if (!remove && !url) { setDialog({ ...dialog, error: text.invalidUrl }); return; }
    mutate(() => {
      const existing = dialogNode.current;
      if (existing && visual.current?.contains(existing)) {
        if (remove) { if (dialog.kind === "link") existing.replaceWith(...existing.childNodes); else existing.remove(); }
        else {
          existing.setAttribute(dialog.kind === "image" ? "src" : "href", url!);
          if (dialog.kind === "image") existing.setAttribute("alt", dialog.text);
          else if (existing.textContent !== dialog.text) existing.textContent = dialog.text || url;
        }
      } else if (!remove) {
        const selection = document.getSelection();
        if (dialog.kind === "link" && !selection?.isCollapsed && dialog.text === selection?.toString()) command("createLink", url!);
        else command("insertHTML", dialog.kind === "image" ? `<img src="${escapeRichText(url!)}" alt="${escapeRichText(dialog.text)}">` : `<a href="${escapeRichText(url!)}">${escapeRichText(dialog.text || url!)}</a>`);
      }
    });
    closeDialog();
  }
  function toolAction(tool: RichTextTool) {
    if (tool === "undo" || tool === "redo") { undo(tool === "redo"); return; }
    const element = toolElements[tool];
    if (element && !elements.includes(element)) return;
    if (tool === "link" || tool === "image") { openInsert(tool); return; }
    mutate(() => {
      const commands: Partial<Record<RichTextTool, string>> = { bold: "bold", italic: "italic", strike: "strikeThrough", bulletList: "insertUnorderedList", orderedList: "insertOrderedList", rule: "insertHorizontalRule", clear: "removeFormat" };
      if (commands[tool]) { command(commands[tool]!); return; }
      const formats: Partial<Record<RichTextTool, string>> = { paragraph: "p", heading1: "h1", heading2: "h2", heading3: "h3", quote: "blockquote", codeBlock: "pre" };
      if (formats[tool]) { command("formatBlock", active.has(tool) ? "p" : formats[tool]); return; }
      if (tool === "inlineCode") {
        const range = document.getSelection()?.getRangeAt(0);
        if (!range) return;
        const anchor = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
        const existing = anchor?.closest("code");
        if (existing && visual.current?.contains(existing)) { existing.replaceWith(...existing.childNodes); return; }
        const code = document.createElement("code"); code.textContent = range.toString() || text.code;
        range.deleteContents(); range.insertNode(code); range.selectNodeContents(code);
        document.getSelection()?.removeAllRanges(); document.getSelection()?.addRange(range);
      }
    }, true);
  }
  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.nativeEvent.isComposing || locked) return;
    if (event.altKey && event.key === "F10") { event.preventDefault(); container.current?.querySelector<HTMLButtonElement>('[role="toolbar"] button:not(:disabled)')?.focus(); return; }
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      if (key === "z" || key === "y") { event.preventDefault(); undo(key === "y" || event.shiftKey); return; }
      if (mode === "visual" && ["b", "i", "k", "u"].includes(key)) { event.preventDefault(); if (key !== "u") toolAction(({ b: "bold", i: "italic", k: "link" } as const)[key as "b" | "i" | "k"]); }
    }
    if (mode === "visual" && event.key === "Tab" && (active.has("bulletList") || active.has("orderedList"))) { event.preventDefault(); mutate(() => command(event.shiftKey ? "outdent" : "indent"), true); }
  }
  const unavailable = new Set<RichTextTool>();
  if (!history.current.canUndo) unavailable.add("undo"); if (!history.current.canRedo) unavailable.add("redo");
  const visibleGroups = mode === "visual" ? groups : groups.map((group) => group.filter((tool) => tool === "undo" || tool === "redo")).filter((group) => group.length);
  const input = () => {
    if (visual.current) setVisuallyEmpty(!visual.current.textContent && !visual.current.querySelector("img, hr"));
    if (!mutating.current && !composing.current && !locked) { commit(before.current ?? last.current ?? snapshot(), inputKind.current); updateSelection(); }
  };
  const common = { id, "aria-label": label ?? text.editor, "aria-labelledby": labelledBy, "aria-describedby": [describedBy, hintId, message && statusId].filter(Boolean).join(" "), "aria-invalid": ariaInvalid ?? invalid, onKeyDown: keyDown,
    onCompositionStart: () => { if (!composing.current) before.current = snapshot(); composing.current = true; },
    onCompositionEnd: () => { composing.current = false; inputKind.current = "composition"; input(); } };

  return <div {...props} className={cn("control h-auto min-w-0 p-0 focus-within:border-border-strong focus-within:ring-2 focus-within:ring-[rgb(var(--ring))]/15", invalid && "control-invalid focus-within:border-danger focus-within:ring-danger/20", disabled && "opacity-50", className)} {..._ui.attributes}>
    <div ref={container}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0" onPointerDown={() => { keyboardViewSwitch.current = false; }} onKeyDownCapture={(event) => { keyboardViewSwitch.current = ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key); }}>
          <Segmented label={text.modes} size="sm" value={mode} onChange={(next) => changeMode(next as RichTextMode)} items={permittedModes.map((entry) => ({ value: entry, label: text[entry], icon: entry === "visual" ? <TextAa /> : <Code />, disabled }))} />
        </div>
        <span className="text-xs tabular-nums text-fg-subtle">{text.count(model.current.length, maxLength)}</span>
      </div>
      {!readOnly && visibleGroups.length > 0 && <RichTextToolbar groups={visibleGroups} labels={text.tools} label={text.toolbar} active={mode === "visual" ? active : new Set()} disabled={locked} unavailable={unavailable} onAction={toolAction} onFocusEditor={focusEditor} />}
      <div className="relative border-t border-border">
        {mode === "visual" ? <>
          {visuallyEmpty && !readOnly && <span aria-hidden="true" className="pointer-events-none absolute left-4 top-4 text-fg-subtle">{placeholder ?? text.placeholder}</span>}
          <div {...common} ref={visual} role="textbox" aria-multiline="true" aria-placeholder={readOnly ? undefined : placeholder ?? text.placeholder} aria-readonly={readOnly} aria-disabled={disabled} tabIndex={disabled ? -1 : 0} contentEditable={!locked} suppressContentEditableWarning
            className={cn("max-h-[40rem] min-h-64 overflow-y-auto whitespace-pre-wrap break-words p-4 text-base leading-relaxed outline-none", prose, editorClassName)}
            onFocus={() => { if (!locked) command("defaultParagraphSeparator", "p"); }} onInput={input}
            onClick={(event) => { if ((event.target as Element).closest("a")) event.preventDefault(); }}
            onDoubleClick={(event) => { const image = (event.target as Element).closest("img"); if (image && elements.includes("img")) openInsert("image", image); }}
            onPaste={(event) => {
              if (locked) return;
              event.preventDefault();
              if (event.clipboardData.files.length && !event.clipboardData.getData("text/plain")) { setMessage(text.dropHint); return; }
              const html = event.clipboardData.getData("text/html");
              const clean = html ? cleanRichTextHtml(html, elements) : escapeRichText(event.clipboardData.getData("text/plain")).replace(/\r\n?|\n/g, "<br>");
              mutate(() => command("insertHTML", clean));
            }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (!locked) setMessage(text.dropHint); }} />
        </> : <Textarea {...common} ref={raw} value={source} disabled={disabled} readOnly={readOnly} spellCheck={false} autoCapitalize="off" autoCorrect="off"
          className={cn("min-h-64 resize-y rounded-none border-0 p-4 font-mono text-sm shadow-none focus:ring-0", editorClassName)} onChange={() => { if (composing.current) setSource(raw.current?.value ?? ""); else input(); }} />}
      </div>
      <div className="space-y-1 border-t border-border px-3 py-2 text-xs text-fg-muted">
        <p id={hintId}>{readOnly ? text.readOnlyHint : mode === "visual" ? text.visualHint : text.sourceHint}</p>
        <p id={statusId} role="status" aria-live="polite" className={message ? "text-danger-fg" : "sr-only"}>{message}</p>
      </div>
      {name && <input type="hidden" name={name} value={model.current} disabled={disabled} />}
    </div>
    <Modal open={Boolean(dialog)} onClose={closeDialog} title={dialog?.kind === "image" ? text.image : text.link} size="sm" footer={<>
      {dialogNode.current && <Button variant="ghost" className="mr-auto" onClick={() => applyInsert(true)}>{text.remove}</Button>}
      <Button variant="outline" onClick={closeDialog}>{text.cancel}</Button><Button type="submit" form={dialogForm}>{text.apply}</Button>
    </>}>
      {dialog && <form id={dialogForm} className="grid gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); applyInsert(); }}>
        <Field label={text.url} required hint={dialog.kind === "image" ? text.imageHint : text.linkHint} error={dialog.error}>{(field) => <Input id={field.id} autoFocus required value={dialog.url} aria-describedby={field.describedBy} invalid={field.invalid} onChange={(event) => setDialog({ ...dialog, url: event.target.value, error: undefined })} />}</Field>
        <Field label={dialog.kind === "image" ? text.alt : text.linkText} hint={dialog.kind === "image" ? text.altHint : undefined}>{(field) => <Input id={field.id} value={dialog.text} aria-describedby={field.describedBy} onChange={(event) => setDialog({ ...dialog, text: event.target.value })} />}</Field>
      </form>}
    </Modal>
  </div>;
}

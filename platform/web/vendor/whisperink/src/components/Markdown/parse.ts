/*
 * Markdown for help pages and manuals, parsed and drawn by the kit itself so a
 * product renders its documentation with the controls it already has. It reads
 * what documentation is written in — headings, paragraphs, lists (nested and
 * with task boxes), fenced code, tables, quotes, GitHub-style callouts, links,
 * images, emphasis, inline code and <kbd> — and nothing it does not understand
 * is ever put on the page as markup: raw HTML is shown as text.
 */

/* ------------------------------------------------------------------ model */

export type MarkdownInline =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "kbd"; value: string }
  | { type: "break" }
  | { type: "strong" | "em" | "del"; children: MarkdownInline[] }
  | { type: "link"; href: string; title?: string; children: MarkdownInline[] }
  | { type: "image"; src: string; alt: string; title?: string };

export type CalloutKind = "note" | "tip" | "important" | "warning" | "caution";

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; id: string; text: string; children: MarkdownInline[] }
  | { type: "paragraph"; children: MarkdownInline[] }
  | { type: "code"; language?: string; code: string }
  | { type: "list"; ordered: boolean; start: number; tight: boolean; items: { checked?: boolean; blocks: MarkdownBlock[] }[] }
  | { type: "quote"; blocks: MarkdownBlock[] }
  | { type: "callout"; kind: CalloutKind; title?: MarkdownInline[]; blocks: MarkdownBlock[] }
  | { type: "table"; align: ("left" | "center" | "right" | null)[]; header: MarkdownInline[][]; rows: MarkdownInline[][][] }
  | { type: "rule" }
  | { type: "image"; src: string; alt: string; title?: string };

export type MarkdownHeading = { id: string; level: number; text: string };

export type MarkdownDocument = { blocks: MarkdownBlock[]; headings: MarkdownHeading[] };

/* ------------------------------------------------------------------ inline parsing */

const ESCAPABLE = /[\\`*_{}[\]()#+\-.!~<>|"']/;

/** `[text](href "title")` starting at `start`, with nested brackets and parentheses allowed. */
function matchLink(text: string, start: number): { label: string; href: string; title?: string; end: number } | null {
  let depth = 0;
  let close = -1;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (char === "\\") { index += 1; continue; }
    if (char === "[") depth += 1;
    else if (char === "]") { depth -= 1; if (depth === 0) { close = index; break; } }
  }
  if (close === -1 || text[close + 1] !== "(") return null;
  let level = 0;
  let end = -1;
  for (let index = close + 1; index < text.length; index += 1) {
    const char = text[index];
    if (char === "\\") { index += 1; continue; }
    if (char === "(") level += 1;
    else if (char === ")") { level -= 1; if (level === 0) { end = index; break; } }
  }
  if (end === -1) return null;
  const inside = text.slice(close + 2, end).trim();
  const titled = /^(\S+)\s+"([^"]*)"$/.exec(inside) ?? /^(\S+)\s+'([^']*)'$/.exec(inside);
  const href = (titled ? titled[1] : inside).replace(/^<(.*)>$/, "$1");
  return { label: text.slice(start + 1, close), href, title: titled?.[2], end: end + 1 };
}

/** A run of `marker` closing an emphasis that opened at `start`. */
function matchDelimited(text: string, start: number, marker: string): number {
  const open = start + marker.length;
  if (open >= text.length || /\s/.test(text[open])) return -1;
  for (let index = open + 1; index <= text.length - marker.length; index += 1) {
    if (text[index] === "\\") { index += 1; continue; }
    if (text.startsWith(marker, index) && !/\s/.test(text[index - 1])) {
      // A single star must not be the first of a double one, and an underscore stays out of words.
      if (marker.length === 1 && text[index + 1] === marker) continue;
      if (marker === "_" && /\w/.test(text[index + 1] ?? "")) continue;
      return index;
    }
  }
  return -1;
}

export function parseInline(text: string): MarkdownInline[] {
  const nodes: MarkdownInline[] = [];
  let buffer = "";
  const flush = () => { if (buffer) { nodes.push({ type: "text", value: buffer }); buffer = ""; } };
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const rest = text.slice(index);
    if (char === "\\" && index + 1 < text.length) {
      if (text[index + 1] === "\n") { flush(); nodes.push({ type: "break" }); index += 2; continue; }
      if (ESCAPABLE.test(text[index + 1])) { buffer += text[index + 1]; index += 2; continue; }
    }
    if (char === "\n") {
      if (buffer.endsWith("  ")) { buffer = buffer.trimEnd(); flush(); nodes.push({ type: "break" }); } else buffer += " ";
      index += 1;
      continue;
    }
    if (char === "`") {
      const run = /^`+/.exec(rest)![0];
      const close = text.indexOf(run, index + run.length);
      const closes = close !== -1 && text[close + run.length] !== "`";
      if (closes) {
        flush();
        let value = text.slice(index + run.length, close);
        if (value.length > 2 && value.startsWith(" ") && value.endsWith(" ")) value = value.slice(1, -1);
        nodes.push({ type: "code", value });
        index = close + run.length;
      } else { buffer += run; index += run.length; }
      continue;
    }
    if (char === "!" && text[index + 1] === "[") {
      const link = matchLink(text, index + 1);
      if (link) { flush(); nodes.push({ type: "image", src: link.href, alt: link.label, title: link.title }); index = link.end; continue; }
    }
    if (char === "[") {
      const link = matchLink(text, index);
      if (link) { flush(); nodes.push({ type: "link", href: link.href, title: link.title, children: parseInline(link.label) }); index = link.end; continue; }
    }
    if (char === "<") {
      const auto = /^<((?:https?|mailto):[^\s>]+)>/.exec(rest);
      if (auto) { flush(); nodes.push({ type: "link", href: auto[1], children: [{ type: "text", value: auto[1].replace(/^mailto:/, "") }] }); index += auto[0].length; continue; }
      const mail = /^<([\w.+-]+@[\w-]+(?:\.[\w-]+)+)>/.exec(rest);
      if (mail) { flush(); nodes.push({ type: "link", href: `mailto:${mail[1]}`, children: [{ type: "text", value: mail[1] }] }); index += mail[0].length; continue; }
      const kbd = /^<kbd>([^<]*)<\/kbd>/i.exec(rest);
      if (kbd) { flush(); nodes.push({ type: "kbd", value: kbd[1] }); index += kbd[0].length; continue; }
      const br = /^<br\s*\/?>/i.exec(rest);
      if (br) { flush(); nodes.push({ type: "break" }); index += br[0].length; continue; }
    }
    if (char === "h" && (index === 0 || /[\s(]/.test(text[index - 1]))) {
      const url = /^https?:\/\/[^\s<]+/.exec(rest);
      if (url) {
        const href = url[0].replace(/[.,;:!?)]+$/, "");
        flush();
        nodes.push({ type: "link", href, children: [{ type: "text", value: href }] });
        index += href.length;
        continue;
      }
    }
    if (char === "*" || char === "_" || char === "~") {
      const marker = text.startsWith(char + char, index) ? char + char : char;
      const intraword = char === "_" && index > 0 && /\w/.test(text[index - 1]);
      // A single tilde is just a tilde; only a pair strikes through.
      const close = intraword || marker === "~" ? -1 : matchDelimited(text, index, marker);
      if (close !== -1) {
        flush();
        const type = marker === "~~" ? "del" : marker.length === 2 ? "strong" : "em";
        nodes.push({ type, children: parseInline(text.slice(index + marker.length, close)) });
        index = close + marker.length;
        continue;
      }
    }
    buffer += char;
    index += 1;
  }
  flush();
  return nodes;
}

/* ------------------------------------------------------------------ block parsing */

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)[ \t]*$/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>/;
const ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])(?:[ \t]+(.*))?$/;
const TABLE_DELIMITER = /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
const CALLOUT = /^\[!(note|tip|important|warning|caution)\][ \t]*(.*)$/i;

/** A line that begins something other than a paragraph, which ends the paragraph before it. */
function startsBlock(line: string): boolean {
  return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || /^( {0,3})([-*+]|\d{1,9}[.)])[ \t]+\S/.test(line);
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cell = "";
  for (let index = 0; index < trimmed.length; index += 1) {
    if (trimmed[index] === "\\" && trimmed[index + 1] === "|") { cell += "|"; index += 1; }
    else if (trimmed[index] === "|") { cells.push(cell.trim()); cell = ""; }
    else cell += trimmed[index];
  }
  cells.push(cell.trim());
  return cells;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, (umlaut) => ({ ä: "ae", ö: "oe", ü: "ue" })[umlaut] ?? umlaut)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

/** The words of inline content, for ids, search and accessible names. */
export function inlineText(nodes: readonly MarkdownInline[]): string {
  return nodes.map((node) => {
    switch (node.type) {
      case "text": case "code": case "kbd": return node.value;
      case "break": return " ";
      case "image": return node.alt;
      default: return inlineText(node.children);
    }
  }).join("");
}

/** The words of a block tree, for search. */
export function blockText(blocks: readonly MarkdownBlock[]): string {
  return blocks.map((block) => {
    switch (block.type) {
      case "heading": case "paragraph": return inlineText(block.children);
      case "code": return block.code;
      case "list": return block.items.map((item) => blockText(item.blocks)).join("\n");
      case "quote": return blockText(block.blocks);
      case "callout": return `${block.title ? inlineText(block.title) : ""}\n${blockText(block.blocks)}`;
      case "table": return [block.header, ...block.rows].map((row) => row.map(inlineText).join(" ")).join("\n");
      case "image": return block.alt;
      case "rule": return "";
    }
  }).join("\n");
}

function parseBlocks(lines: readonly string[], headings: MarkdownHeading[], ids: Map<string, number>): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  const blank = (line: string | undefined) => line === undefined || !line.trim();
  while (index < lines.length) {
    const line = lines[index];
    if (blank(line)) { index += 1; continue; }

    const fence = FENCE.exec(line);
    if (fence) {
      const [, marker, language] = fence;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !new RegExp(`^ {0,3}${marker[0]}{${marker.length},}[ \\t]*$`).test(lines[index])) { code.push(lines[index]); index += 1; }
      index += 1;
      blocks.push({ type: "code", language: language || undefined, code: code.join("\n") });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const children = parseInline(heading[2]);
      const text = inlineText(children);
      const base = slugify(text);
      const seen = ids.get(base) ?? 0;
      ids.set(base, seen + 1);
      const id = seen ? `${base}-${seen + 1}` : base;
      const level = heading[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      headings.push({ id, level, text });
      blocks.push({ type: "heading", level, id, text, children });
      index += 1;
      continue;
    }

    if (RULE.test(line)) { blocks.push({ type: "rule" }); index += 1; continue; }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (index < lines.length && QUOTE.test(lines[index])) { inner.push(lines[index].replace(/^ {0,3}> ?/, "")); index += 1; }
      const callout = CALLOUT.exec(inner[0] ?? "");
      if (callout) {
        const kind = callout[1].toLowerCase() as CalloutKind;
        blocks.push({ type: "callout", kind, title: callout[2] ? parseInline(callout[2]) : undefined, blocks: parseBlocks(inner.slice(1), headings, ids) });
      } else blocks.push({ type: "quote", blocks: parseBlocks(inner, headings, ids) });
      continue;
    }

    const item = ITEM.exec(line);
    if (item && item[3] !== undefined) {
      const ordered = /\d/.test(item[2]);
      const start = ordered ? Number.parseInt(item[2], 10) : 1;
      const items: { checked?: boolean; blocks: MarkdownBlock[] }[] = [];
      let tight = true;
      while (index < lines.length) {
        const match = ITEM.exec(lines[index]);
        if (!match || /\d/.test(match[2]) !== ordered) break;
        const first = match[3] ?? "";
        const contentIndent = match[1].length + match[2].length + 1;
        const own: string[] = [first];
        index += 1;
        let pendingBlanks = 0;
        while (index < lines.length) {
          const next = lines[index];
          if (blank(next)) { pendingBlanks += 1; index += 1; continue; }
          const indent = next.length - next.trimStart().length;
          if (indent >= contentIndent) {
            if (pendingBlanks) { tight = false; own.push(...Array(pendingBlanks).fill("")); pendingBlanks = 0; }
            own.push(next.slice(contentIndent));
            index += 1;
            continue;
          }
          break;
        }
        // Blank lines before the next item make the list loose; blank lines at the very end belong to nobody.
        if (pendingBlanks && index < lines.length && ITEM.test(lines[index])) tight = false;
        const task = /^\[([ xX])\][ \t]+/.exec(own[0]);
        if (task) own[0] = own[0].slice(task[0].length);
        items.push({ checked: task ? task[1] !== " " : undefined, blocks: parseBlocks(own, headings, ids) });
      }
      blocks.push({ type: "list", ordered, start, tight, items });
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && TABLE_DELIMITER.test(lines[index + 1]) && lines[index + 1].includes("-")) {
      const header = splitRow(line).map(parseInline);
      const align = splitRow(lines[index + 1]).map((cell) => (cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : cell.startsWith(":") ? "left" : null));
      const rows: MarkdownInline[][][] = [];
      index += 2;
      while (index < lines.length && !blank(lines[index]) && lines[index].includes("|") && !startsBlock(lines[index])) {
        const cells = splitRow(lines[index]).map(parseInline);
        rows.push(Array.from({ length: header.length }, (_, column) => cells[column] ?? []));
        index += 1;
      }
      blocks.push({ type: "table", align, header, rows });
      continue;
    }

    // A paragraph runs until a blank line or the start of another block.
    const text: string[] = [line];
    index += 1;
    while (index < lines.length && !blank(lines[index]) && !startsBlock(lines[index]) && !(lines[index].includes("|") && TABLE_DELIMITER.test(lines[index + 1] ?? ""))) {
      text.push(lines[index]);
      index += 1;
    }
    const children = parseInline(text.map((part) => part.trimStart()).join("\n").trim());
    const only = children.length === 1 ? children[0] : null;
    if (only?.type === "image") blocks.push({ type: "image", src: only.src, alt: only.alt, title: only.title });
    else if (children.length) blocks.push({ type: "paragraph", children });
  }
  return blocks;
}

/** Parses a markdown source into blocks plus the headings it contains, in order. */
export function parseMarkdown(source: string): MarkdownDocument {
  const headings: MarkdownHeading[] = [];
  const blocks = parseBlocks(source.replace(/\r\n?/g, "\n").split("\n"), headings, new Map());
  return { blocks, headings };
}

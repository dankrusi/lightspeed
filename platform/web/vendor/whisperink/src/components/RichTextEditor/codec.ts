/** The editor's deliberately bounded Markdown vocabulary. Paragraphs and line breaks are always available. */
export type RichTextElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "strong" | "em" | "s" | "ul" | "ol" | "blockquote" | "a" | "img" | "pre" | "code" | "hr";

export const richTextElements: readonly RichTextElement[] = ["h1", "h2", "h3", "strong", "em", "s", "ul", "ol", "blockquote", "a", "img", "pre", "code", "hr"];

export function escapeRichText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Web URLs; links also accept site paths, anchors, mailto and telephone numbers. Images stay absolute HTTP(S). */
export function richTextUrl(value: string, image = false): string | null {
  const url = value.trim();
  if (/[\u0000-\u001f\u007f\\]/.test(url)) return null;
  if (!image && /^tel:\+?[0-9][0-9(). -]{2,30}$/i.test(url)) return url;
  if (/[\u0000-\u0020\u007f]/.test(url)) return null;
  if (!image && (/^\/(?!\/)/.test(url) || /^#[^\s]*$/.test(url))) return url;
  if (!/^(https?:\/\/|mailto:)/i.test(url) || (image && !/^https?:\/\//i.test(url))) return null;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return null;
    return parsed.protocol === "mailto:" ? (parsed.pathname ? url : null) : (parsed.hostname ? url : null);
  } catch { return null; }
}

const blocks = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "HR", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "TABLE", "TR"]);
const discard = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE", "NOSCRIPT", "HEAD", "INPUT", "BUTTON", "SELECT", "TEXTAREA", "VIDEO", "AUDIO"]);
const aliases: Record<string, string> = { b: "strong", i: "em", strike: "s", del: "s" };

function plainText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof Element && node.localName === "br") return "\n";
  return Array.from(node.childNodes, plainText).join("");
}

function fragment(html: string): DocumentFragment {
  // A template is inert, including images: parsing untrusted source must not execute or fetch it.
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
}

/** Browser-only HTML normalizer. Exports bare semantic elements; only href, src, alt and ol.start survive. */
export function cleanRichTextHtml(html: string, elements: readonly RichTextElement[] = richTextElements): string {
  const allowed = new Set<string>(["p", "br", "li", ...elements]);
  const visit = (node: Node, depth = 0): string => {
    if (depth > 100) return "";
    if (node.nodeType === Node.TEXT_NODE) return escapeRichText((node.textContent ?? "").replace(/\u00a0/g, " "));
    if (!(node instanceof Element) || node.namespaceURI !== "http://www.w3.org/1999/xhtml" || discard.has(node.tagName)) return "";
    let tag = aliases[node.localName] ?? node.localName;
    if (/^h[4-6]$/.test(tag) && !allowed.has(tag)) tag = "h3";
    const children = () => Array.from(node.childNodes, (child) => visit(child, depth + 1)).join("");
    if (tag === "img") {
      const src = richTextUrl(node.getAttribute("src") ?? "", true);
      const alt = (node.getAttribute("alt") ?? "").replace(/[\r\n]+/g, " ");
      return allowed.has(tag) && src ? `<img src="${escapeRichText(src)}" alt="${escapeRichText(alt)}">` : escapeRichText(alt);
    }
    if (tag === "a") {
      const href = richTextUrl(node.getAttribute("href") ?? "");
      return allowed.has(tag) && href ? `<a href="${escapeRichText(href)}">${children()}</a>` : children();
    }
    if (tag === "br") return "<br>";
    if (tag === "hr") return allowed.has(tag) ? "<hr>" : "";
    if (tag === "pre") {
      const text = escapeRichText(plainText(node));
      return allowed.has(tag) ? `<pre><code>${text}</code></pre>` : `<p>${text.replace(/\n/g, "<br>")}</p>`;
    }
    if (tag === "div" || !allowed.has(tag)) {
      const content = children();
      if (tag === "td" || tag === "th") return `${content} `;
      if (blocks.has(node.tagName)) return Array.from(node.children).some((child) => blocks.has(child.tagName)) ? content : `<p>${content}</p>`;
      return content;
    }
    if (tag === "li" && (!["ul", "ol"].includes(node.parentElement?.localName ?? "") || !allowed.has(node.parentElement?.localName ?? ""))) tag = "p";
    const start = tag === "ol" ? Number(node.getAttribute("start")) : 1;
    const attribute = tag === "ol" && Number.isSafeInteger(start) && start > 1 && start <= 999999999 ? ` start="${start}"` : "";
    return `<${tag}${attribute}>${children()}</${tag}>`;
  };
  const clean = fragment(Array.from(fragment(html).childNodes, (node) => visit(node)).join(""));
  // Chromium indent can put a sub-list beside LI rather than inside it. Repair that
  // browser editing shape before either HTML export or Markdown serialization.
  for (const list of clean.querySelectorAll("ul, ol")) {
    for (const node of Array.from(list.childNodes)) {
      if (node instanceof Element && node.localName === "li") continue;
      if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) { node.remove(); continue; }
      let item = node.previousSibling instanceof Element && node.previousSibling.localName === "li" ? node.previousSibling : null;
      if (!item || !(node instanceof Element) || !["ul", "ol"].includes(node.localName)) { item = document.createElement("li"); list.insertBefore(item, node); }
      item.appendChild(node);
    }
  }
  // Browser-created DIVs and root inline runs become real paragraphs, never styled containers.
  const wrapRuns = (parent: ParentNode) => {
    let paragraph: HTMLParagraphElement | null = null;
    for (const node of Array.from(parent.childNodes)) {
      if (node instanceof Element && blocks.has(node.tagName)) {
        paragraph = null;
        if (node.tagName === "BLOCKQUOTE") wrapRuns(node);
      } else {
        if (!paragraph && node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) { node.remove(); continue; }
        if (!paragraph) { paragraph = document.createElement("p"); parent.insertBefore(paragraph, node); }
        paragraph.appendChild(node);
      }
    }
  };
  wrapRuns(clean);
  const container = document.createElement("div");
  container.appendChild(clean);
  return container.innerHTML;
}

function emphasisEnd(source: string, marker: string, budget: { remaining: number }): number {
  const stack = [marker.length];
  for (let index = marker.length; index < source.length && budget.remaining-- > 0;) {
    if (source[index] === "\\") { index += 2; continue; }
    if (source[index] === "`") {
      const code = /^(`+)([\s\S]*?)\1(?!`)/.exec(source.slice(index));
      if (code) { index += code[0].length; continue; }
    }
    if (source[index] !== marker[0]) { index++; continue; }
    let count = 1;
    while (source[index + count] === marker[0]) count++;
    let remaining = count;
    const left = source[index - 1], right = source[index + count];
    const close = left && !/\s/.test(left) && !(marker[0] === "_" && right && /[\p{L}\p{N}]/u.test(right));
    if (close) {
      while (stack.length && remaining >= stack[stack.length - 1]) {
        const length = stack.pop()!;
        if (!stack.length) return index + count - remaining;
        remaining -= length;
      }
    }
    if (remaining && right && !/\s/.test(right) && !(marker[0] === "_" && left && /[\p{L}\p{N}]/u.test(left))) stack.push(remaining);
    index += count;
  }
  return -1;
}

function inlineMarkdown(source: string, depth = 0, budget = { remaining: source.length * 40 }): string {
  if (depth > 30) return escapeRichText(source);
  let out = "";
  for (let i = 0; i < source.length;) {
    const rest = source.slice(i);
    if (rest[0] === "\\" && rest.length > 1 && /[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]/.test(rest[1])) { out += escapeRichText(rest[1]); i += 2; continue; }
    const code = /^(`+)([\s\S]*?)\1(?!`)/.exec(rest);
    if (code) { out += `<code>${escapeRichText(code[2].replace(/^ (.*) $/, "$1"))}</code>`; i += code[0].length; continue; }
    // Balanced URL parentheses and escaped label delimiters are handled without a greedy link regex.
    const image = rest.startsWith("![");
    if (image || rest[0] === "[") {
      const start = image ? 2 : 1;
      let end = start, brackets = 1;
      for (; end < rest.length && budget.remaining-- > 0; end++) {
        if (rest[end] === "\\") { end++; continue; }
        if (rest[end] === "[") brackets++;
        if (rest[end] === "]" && --brackets === 0) break;
      }
      if (rest.slice(end, end + 2) === "](") {
        let close = end + 2, nesting = 1;
        for (; close < rest.length && budget.remaining-- > 0; close++) {
          if (rest[close] === "\\") { close++; continue; }
          if (rest[close] === "(") nesting++;
          if (rest[close] === ")" && --nesting === 0) break;
        }
        if (!nesting) {
          const destination = rest.slice(end + 2, close).trim().replace(/^<([^>]+)>$/, "$1").replace(/\\([()\\])/g, "$1");
          const url = richTextUrl(destination, image);
          const label = rest.slice(start, end);
          if (url) out += image ? `<img src="${escapeRichText(url)}" alt="${escapeRichText(label.replace(/\\(.)/g, "$1"))}">` : `<a href="${escapeRichText(url)}">${inlineMarkdown(label, depth + 1, budget)}</a>`;
          else out += escapeRichText(label.replace(/\\(.)/g, "$1"));
          i += close + 1; continue;
        }
      }
    }
    let matched = false;
    for (const [marker, tag] of [["***", "strong"], ["___", "strong"], ["**", "strong"], ["__", "strong"], ["~~", "s"], ["*", "em"], ["_", "em"]]) {
      if (!rest.startsWith(marker) || /\s/.test(rest[marker.length] ?? " ")) continue;
      if (marker[0] === "_" && i && /[\p{L}\p{N}]/u.test(source[i - 1])) continue;
      const end = emphasisEnd(rest, marker, budget);
      if (end < 0) continue;
      const content = inlineMarkdown(rest.slice(marker.length, end), depth + 1, budget);
      out += marker.length === 3 ? `<strong><em>${content}</em></strong>` : `<${tag}>${content}</${tag}>`;
      i += end + marker.length; matched = true; break;
    }
    if (!matched) { out += escapeRichText(source[i]); i++; }
  }
  return out;
}

function markdownBlocks(source: string, depth = 0): string {
  if (depth > 30) return `<p>${escapeRichText(source)}</p>`;
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const list = (line: string) => /^( *)([-+*]|\d+[.)]) +(.*)$/.exec(line);
  const begins = (line: string) => /^(?:#{1,6} |>|`{3,}|~{3,}|(?:[-*_] *){3,}$)/.test(line) || list(line);
  let html = "", i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^(`{3,}|~{3,})[^`]*$/.exec(line);
    if (fence) {
      const body: string[] = []; i++;
      while (i < lines.length && !(lines[i].trim().startsWith(fence[1]) && new RegExp(`^${fence[1][0]}+$`).test(lines[i].trim()))) body.push(lines[i++]);
      if (i < lines.length) i++;
      html += `<pre><code>${escapeRichText(body.join("\n"))}</code></pre>`; continue;
    }
    const heading = /^(#{1,6}) +(.*)$/.exec(line);
    if (heading) { html += `<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`; i++; continue; }
    if (/^\s*(?:\*\s*){3,}$|^\s*(?:-\s*){3,}$|^\s*(?:_\s*){3,}$/.test(line)) { html += "<hr>"; i++; continue; }
    if (/^> ?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^> ?/.test(lines[i])) quote.push(lines[i++].replace(/^> ?/, ""));
      html += `<blockquote>${markdownBlocks(quote.join("\n"), depth + 1)}</blockquote>`; continue;
    }
    const first = list(line);
    if (first) {
      const ordered = /^\d/.test(first[2]), indent = first[1].length, start = parseInt(first[2], 10);
      html += ordered ? `<ol${start > 1 ? ` start="${start}"` : ""}>` : "<ul>";
      while (i < lines.length) {
        const item = list(lines[i]);
        if (!item || item[1].length !== indent || /^\d/.test(item[2]) !== ordered) break;
        const body = [item[3]], padding = item[0].length - item[3].length; i++;
        while (i < lines.length) {
          if (!lines[i].trim() && i + 1 < lines.length && lines[i + 1].startsWith(" ".repeat(padding))) { body.push(""); i++; continue; }
          if (lines[i].trim() && lines[i].startsWith(" ".repeat(padding))) { body.push(lines[i++].slice(padding)); continue; }
          break;
        }
        html += `<li>${markdownBlocks(body.join("\n"), depth + 1)}</li>`;
      }
      html += ordered ? "</ol>" : "</ul>"; continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !begins(lines[i])) paragraph.push(lines[i++]);
    html += `<p>${paragraph.map((part) => inlineMarkdown(part.replace(/ {2}$/, ""))).join("<br>")}</p>`;
  }
  return html;
}

/** Browser-only Markdown rendering. Raw authored HTML is literal text, never executable markup. */
export function richTextMarkdownToHtml(markdown: string, elements: readonly RichTextElement[] = richTextElements): string {
  return cleanRichTextHtml(markdownBlocks(markdown), elements);
}

function escapeMarkdown(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/([`*_\[\]~])/g, "\\$1")
    .replace(/^(\s*)([#+-])(?=\s|#)/gm, "$1\\$2").replace(/^(\s*)(>|---)/gm, "$1\\$2").replace(/^(\s*\d+)([.)])(?=\s)/gm, "$1\\$2");
}

/** Browser-only HTML → Markdown conversion, using the same allowlist as formatted editing and paste. */
export function richTextHtmlToMarkdown(html: string, elements: readonly RichTextElement[] = richTextElements): string {
  const root = fragment(cleanRichTextHtml(html, elements));
  const inline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeMarkdown(node.textContent ?? "");
    if (!(node instanceof Element)) return "";
    const content = Array.from(node.childNodes, inline).join("");
    const wrap = (marker: string) => content.trim() ? `${content.match(/^\s*/)?.[0] ?? ""}${marker}${content.trim()}${marker}${content.match(/\s*$/)?.[0] ?? ""}` : content;
    switch (node.localName) {
      case "strong": return wrap("**");
      case "em": return wrap("*");
      case "s": return wrap("~~");
      case "code": {
        const text = node.textContent ?? "";
        const fence = "`".repeat(Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length)) + 1);
        const pad = text.startsWith("`") || text.endsWith("`") || /^ .* $/.test(text) ? " " : "";
        return `${fence}${pad}${text}${pad}${fence}`;
      }
      case "a": return `[${content}](${(node.getAttribute("href") ?? "").replace(/[()\\]/g, "\\$&")})`;
      case "img": return `![${escapeMarkdown(node.getAttribute("alt") ?? "")}](${(node.getAttribute("src") ?? "").replace(/[()\\]/g, "\\$&")})`;
      case "br": return "\n";
      default: return content;
    }
  };
  const block = (node: Node): string => {
    if (!(node instanceof Element)) return inline(node);
    const content = () => Array.from(node.childNodes, inline).join("").trim();
    switch (node.localName) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": return `${"#".repeat(Number(node.localName[1]))} ${content()}`;
      case "blockquote": return Array.from(node.childNodes, block).join("\n\n").split("\n").map((line) => `> ${line}`).join("\n");
      case "pre": {
        const text = node.textContent ?? "";
        const fence = "`".repeat(Math.max(2, ...(text.match(/`+/g) ?? []).map((run) => run.length)) + 1);
        return `${fence}\n${text}\n${fence}`;
      }
      case "hr": return "---";
      case "ul": case "ol": {
        const start = Number(node.getAttribute("start")) || 1;
        return Array.from(node.children).map((li, index) => {
          const marker = node.localName === "ol" ? `${start + index}. ` : "- ";
          let body = "", run = "";
          for (const child of Array.from(li.childNodes)) {
            if (child instanceof Element && blocks.has(child.tagName)) {
              if (run.trim()) { body = [body.trimEnd(), run.trim()].filter(Boolean).join("\n\n"); run = ""; }
              body = [body.trimEnd(), block(child)].filter(Boolean).join(["ul", "ol"].includes(child.localName) ? "\n" : "\n\n");
              body += "\n\n";
            } else run += inline(child);
          }
          body = (body + run).trim();
          return marker + body.replace(/\n/g, `\n${" ".repeat(marker.length)}`);
        }).join("\n");
      }
      default: return content();
    }
  };
  return Array.from(root.childNodes, block).filter(Boolean).join("\n\n").trim();
}

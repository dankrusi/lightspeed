import { createElement, type MouseEvent, type ReactNode, useMemo } from "react";
import { cn } from "../../cn.js";
import { Check, LinkSimple } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Alert } from "../Alert/Alert.js";
import { CodeBlock } from "../CodeBlock/CodeBlock.js";
import { InlineCode } from "../CodeBlock/InlineCode.js";
import { Kbd } from "../Kbd/Kbd.js";
import { Table } from "../Table/Table.js";
import { TBody } from "../Table/TBody.js";
import { TD } from "../Table/TD.js";
import { TH } from "../Table/TH.js";
import { THead } from "../Table/THead.js";
import { TR } from "../Table/TR.js";
import { type CalloutKind, inlineText, type MarkdownBlock, type MarkdownInline, parseMarkdown } from "./parse.js";

const calloutTone: Record<CalloutKind, "info" | "success" | "warning" | "danger"> = { note: "info", tip: "success", important: "info", warning: "warning", caution: "danger" };

/** Whether a link leaves the site, in which case it opens where the browser puts it and says so. */
const external = (href: string) => /^(https?:)?\/\//.test(href) || href.startsWith("mailto:");

type RenderContext = {
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  anchorLabel: (heading: string) => string;
  calloutTitle: (kind: CalloutKind) => string;
};

function renderInline(nodes: readonly MarkdownInline[], context: RenderContext): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text": return node.value;
      case "code": return <InlineCode key={index}>{node.value}</InlineCode>;
      case "kbd": return <Kbd key={index}>{node.value}</Kbd>;
      case "break": return <br key={index} />;
      case "strong": return <strong key={index} className="font-semibold text-fg">{renderInline(node.children, context)}</strong>;
      case "em": return <em key={index}>{renderInline(node.children, context)}</em>;
      case "del": return <del key={index} className="text-fg-muted">{renderInline(node.children, context)}</del>;
      case "image": return <img key={index} src={node.src} alt={node.alt} title={node.title} loading="lazy" className="inline-block max-w-full rounded align-middle" />;
      case "link": {
        const away = external(node.href);
        return (
          <a
            key={index}
            href={node.href}
            title={node.title}
            rel={away ? "noreferrer" : undefined}
            onClick={context.onNavigate ? (event) => context.onNavigate?.(node.href, event) : undefined}
            className="focus-ring rounded-sm font-medium text-fg underline decoration-fg-subtle underline-offset-4 transition-colors hover:decoration-fg"
          >
            {renderInline(node.children, context)}
          </a>
        );
      }
    }
  });
}

const headingClass: Record<number, string> = {
  1: "mb-4 mt-0 text-3xl",
  2: "mb-3 mt-10 border-b border-border pb-2 text-xl first:mt-0",
  3: "mb-2 mt-8 text-lg",
  4: "mb-2 mt-6 text-base",
  5: "mb-1 mt-5 text-base",
  6: "mb-1 mt-4 text-sm uppercase tracking-wider text-fg-muted",
};

function renderBlocks(blocks: readonly MarkdownBlock[], context: RenderContext, tight = false): ReactNode[] {
  return blocks.map((block, index) => {
    switch (block.type) {
      case "heading":
        return createElement(
          `h${block.level}`,
          { key: index, id: block.id, className: cn("group/heading scroll-mt-4 font-heading font-semibold tracking-heading", headingClass[block.level]) },
          renderInline(block.children, context),
          // The address of the section, shown as the heading is pointed at.
          <a
            href={`#${block.id}`}
            aria-label={context.anchorLabel(block.text)}
            onClick={context.onNavigate ? (event) => context.onNavigate?.(`#${block.id}`, event) : undefined}
            className="focus-ring ml-2 inline-grid size-5 place-items-center rounded align-middle text-fg-subtle opacity-0 transition-opacity hover:text-fg focus-visible:opacity-100 group-hover/heading:opacity-100"
          >
            <LinkSimple className="size-3.5" />
          </a>,
        );
      case "paragraph":
        return tight ? <span key={index} className="block">{renderInline(block.children, context)}</span> : <p key={index} className="my-3 leading-6">{renderInline(block.children, context)}</p>;
      case "code":
        return <CodeBlock key={index} code={block.code} language={block.language} className="my-4" />;
      case "list": {
        const Tag = block.ordered ? "ol" : "ul";
        const tasks = block.items.some((item) => item.checked !== undefined);
        return (
          <Tag key={index} start={block.ordered && block.start !== 1 ? block.start : undefined} className={cn("my-3 pl-6 marker:text-fg-subtle [li_&]:my-1", tasks ? "list-none pl-1" : block.ordered ? "list-decimal" : "list-disc")}>
            {block.items.map((item, position) => (
              <li key={position} className={cn("pl-1", block.tight ? "my-0.5" : "my-2", item.checked !== undefined && "flex items-start gap-2")}>
                {item.checked !== undefined && (
                  // A box that reports rather than asks: the document says whether it is done.
                  <span aria-hidden="true" className={cn("mt-1 grid size-4 shrink-0 place-items-center rounded border", item.checked ? "border-primary bg-primary text-primary-fg" : "border-border-strong bg-surface")}>
                    {item.checked && <Check className="size-3" strokeWidth={3} />}
                  </span>
                )}
                <span className={cn("min-w-0", item.checked !== undefined && "flex-1", item.checked && "text-fg-muted line-through")}>
                  {item.checked !== undefined && <span className="sr-only">{item.checked ? "[x] " : "[ ] "}</span>}
                  {renderBlocks(item.blocks, context, block.tight)}
                </span>
              </li>
            ))}
          </Tag>
        );
      }
      case "quote":
        return <blockquote key={index} className="my-4 border-l-2 border-border-strong pl-4 text-fg-muted">{renderBlocks(block.blocks, context)}</blockquote>;
      case "callout":
        return (
          <Alert key={index} tone={calloutTone[block.kind]} title={block.title ? inlineText(block.title) : context.calloutTitle(block.kind)} className="my-4">
            <div className="[&>p]:my-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{renderBlocks(block.blocks, context)}</div>
          </Alert>
        );
      case "table":
        return (
          <div key={index} className="my-4 overflow-hidden rounded-md border border-border">
            <Table className="text-sm">
              <THead>
                <tr>{block.header.map((cell, column) => <TH key={column} align={block.align[column] ?? "left"}>{renderInline(cell, context)}</TH>)}</tr>
              </THead>
              <TBody className="[&_td]:h-10 [&_td]:py-2">
                {block.rows.map((row, position) => (
                  <TR key={position}>{row.map((cell, column) => <TD key={column} align={block.align[column] === "right" ? "right" : "left"} className={cn(block.align[column] === "center" && "text-center")}>{renderInline(cell, context)}</TD>)}</TR>
                ))}
              </TBody>
            </Table>
          </div>
        );
      case "rule":
        return <hr key={index} className="my-8 border-border" />;
      case "image":
        return (
          <figure key={index} className="my-4">
            <img src={block.src} alt={block.alt} loading="lazy" className="max-w-full rounded-md border border-border" />
            {block.title && <figcaption className="mt-2 text-xs text-fg-muted">{block.title}</figcaption>}
          </figure>
        );
    }
  });
}

/**
 * Renders markdown with the kit's own elements: code in `CodeBlock`, tables in
 * `Table`, callouts in `Alert`, keys in `Kbd`. Headings get an id made from
 * their words (an outline or a link can point at them) and an anchor shown on
 * hover. Links call `onNavigate` first, so an application can route the ones
 * that mean its own pages and leave the rest to the browser.
 * @category content
 */
export function Markdown({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  source,
  onNavigate,
  className,
}: ({
  source: string;
  /** Called for every link, including heading anchors; `preventDefault()` to take it over. */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("markdown", "Display structured document content", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const document = useMemo(() => parseMarkdown(source), [source]);
  const context = useMemo<RenderContext>(
    () => ({ onNavigate, anchorLabel: text.markdown.anchor, calloutTitle: (kind) => text.markdown.callouts[kind] }),
    [onNavigate, text],
  );
  return <div className={cn("text-base text-fg [&>:first-child]:mt-0 [&>:last-child]:mb-0", className)} {..._ui.attributes}>{renderBlocks(document.blocks, context)}</div>;
}

import { type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { ArrowLeft, ArrowRight, CaretRight, ListBullets, MagnifyingGlass } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Breadcrumbs } from "../Breadcrumbs/Breadcrumbs.js";
import { Button } from "../Button/Button.js";
import { EmptyState } from "../EmptyState/EmptyState.js";
import { SearchInput } from "../Input/SearchInput.js";
import { Markdown } from "../Markdown/Markdown.js";
import { blockText, type MarkdownBlock, type MarkdownHeading, parseMarkdown } from "../Markdown/parse.js";

/* ------------------------------------------------------------------ model */

/** One page of a manual: markdown with a place in the table of contents. */
export type ManualPage = {
  id: string;
  title: string;
  /** Markdown source. A leading `# Heading` stands in for the title on the page. */
  content: string;
  /** Words the search should find this page by, besides its own. */
  keywords?: string;
  icon?: ReactNode;
  /** Pages beneath this one; the page itself stays readable as the chapter's opening. */
  children?: readonly ManualPage[];
  /** Sections of the page, listed in the contents beneath it after its children; each jumps to the heading on the page that carries its id. */
  sections?: readonly ManualSection[];
};

/** A section of a page as the contents names it: the id of a heading on the page and its title. */
export type ManualSection = { id: string; title: string };

type Entry = { page: ManualPage; trail: ManualPage[]; depth: number };

function flatten(pages: readonly ManualPage[], trail: ManualPage[] = []): Entry[] {
  return pages.flatMap((page) => [{ page, trail, depth: trail.length }, ...flatten(page.children ?? [], [...trail, page])]);
}

/* ------------------------------------------------------------------ search */

type Section = { heading?: MarkdownHeading; text: string };
type Indexed = { entry: Entry; words: string; sections: Section[] };
type Hit = { entry: Entry; heading?: MarkdownHeading; snippet: { text: string; mark: boolean }[]; score: number };

/** The pages cut into what each heading introduces, which is what a result points at. */
function indexPage(entry: Entry, blocks: MarkdownBlock[], headings: MarkdownHeading[]): Indexed {
  const sections: Section[] = [];
  let current: Section = { text: "" };
  let seen = 0;
  for (const block of blocks) {
    if (block.type === "heading" && block.level <= 3) {
      if (current.text.trim() || current.heading) sections.push(current);
      current = { heading: headings[seen], text: "" };
    }
    if (block.type === "heading") seen += 1;
    else current.text += `${blockText([block])}\n`;
  }
  sections.push(current);
  return { entry, words: `${entry.page.title} ${entry.page.keywords ?? ""}`.toLowerCase(), sections };
}

/** The text cut where the terms occur, so they can be marked. */
function highlight(text: string, terms: readonly string[]): Hit["snippet"] {
  const parts: Hit["snippet"] = [];
  const pattern = new RegExp(terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), mark: false });
    parts.push({ text: match[0], mark: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mark: false });
  return parts;
}

/** A stretch of text around the first hit, so a result says where in the page it was found. */
function snippet(text: string, terms: readonly string[]): Hit["snippet"] {
  const lower = text.toLowerCase();
  const found = terms.map((term) => lower.indexOf(term)).filter((at) => at >= 0);
  if (!found.length) return [{ text: text.replace(/\s+/g, " ").trim().slice(0, 120), mark: false }];
  const first = Math.min(...found);
  const from = Math.max(0, first - 60);
  const to = Math.min(text.length, first + 100);
  const parts = highlight(text.slice(from, to).replace(/\s+/g, " "), terms);
  if (from > 0) parts.unshift({ text: "… ", mark: false });
  if (to < text.length) parts.push({ text: " …", mark: false });
  return parts;
}

function search(index: readonly Indexed[], query: string): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hits: Hit[] = [];
  for (const { entry, words, sections } of index) {
    const inTitle = terms.every((term) => words.includes(term));
    if (inTitle) hits.push({ entry, snippet: [{ text: sections[0]?.text.replace(/\s+/g, " ").trim().slice(0, 120) ?? "", mark: false }], score: 3 });
    for (const section of sections) {
      const heading = section.heading?.text.toLowerCase() ?? "";
      const body = section.text.toLowerCase();
      if (!terms.every((term) => heading.includes(term) || body.includes(term))) continue;
      // The page's own entry already stands for its opening when the title matched.
      if (inTitle && !section.heading) continue;
      const inHeading = terms.every((term) => heading.includes(term));
      hits.push({ entry, heading: section.heading, snippet: snippet(inHeading ? section.text.trim() || section.heading!.text : section.text, terms), score: inHeading ? 2 : 1 });
    }
  }
  return hits.sort((left, right) => right.score - left.score).slice(0, 25);
}

/* ------------------------------------------------------------------ navigation */

function NavEntry({ entry, active, section, open, hrefFor, onOpen }: {
  entry: Entry;
  active: string | null;
  /** Id of the section being read on the active page, so its entry is marked. */
  section: string | null;
  open: Set<string>;
  hrefFor?: (page: ManualPage, section?: ManualSection) => string;
  onOpen: (id: string, anchor: string | null, event: MouseEvent<HTMLElement>) => void;
}) {
  const text = useText();
  const { page } = entry;
  const children = page.children ?? [];
  const sections = page.sections ?? [];
  const nested = children.length > 0 || sections.length > 0;
  const [expanded, setExpanded] = useState(open.has(page.id));
  // A chapter that holds the page being read, or is that page, opens on its own and stays open.
  useEffect(() => { if (open.has(page.id)) setExpanded(true); }, [open, page.id]);
  const current = page.id === active;
  const className = cn(
    "focus-ring flex min-h-8 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
    current ? "bg-subtle font-medium text-fg" : "text-fg-muted hover:bg-subtle/70 hover:text-fg",
  );
  const label = <>{page.icon}<span className="min-w-0 flex-1">{page.title}</span></>;
  // A section entry is a jump within the page; it is marked while that section is being read.
  const sectionEntry = (item: ManualSection) => {
    const reading = current && section === item.id;
    const sectionClass = cn(
      "focus-ring flex min-h-8 w-full items-center rounded px-2 py-1 text-left text-sm transition-colors",
      reading ? "font-medium text-fg" : "text-fg-muted hover:bg-subtle/70 hover:text-fg",
    );
    return (
      <li key={item.id}>
        {hrefFor ? (
          <a href={hrefFor(page, item)} aria-current={reading ? "location" : undefined} onClick={(event) => onOpen(page.id, item.id, event)} className={sectionClass}>{item.title}</a>
        ) : (
          <button type="button" aria-current={reading ? "location" : undefined} onClick={(event) => onOpen(page.id, item.id, event)} className={sectionClass}>{item.title}</button>
        )}
      </li>
    );
  };
  return (
    <li>
      <div className="flex items-stretch gap-0.5">
        {hrefFor ? (
          <a href={hrefFor(page)} aria-current={current ? "page" : undefined} onClick={(event) => onOpen(page.id, null, event)} className={className}>{label}</a>
        ) : (
          <button type="button" aria-current={current ? "page" : undefined} onClick={(event) => onOpen(page.id, null, event)} className={className}>{label}</button>
        )}
        {nested && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? text.tree.collapse(page.title) : text.tree.expand(page.title)}
            onClick={() => setExpanded((value) => !value)}
            className="focus-ring grid w-7 shrink-0 place-items-center rounded text-fg-subtle hover:bg-subtle hover:text-fg"
          >
            <CaretRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
          </button>
        )}
      </div>
      {nested && expanded && (
        <ul className="ml-3 mt-0.5 border-l border-border pl-2">
          {children.map((child) => <NavEntry key={child.id} entry={{ page: child, trail: [...entry.trail, page], depth: entry.depth + 1 }} active={active} section={section} open={open} hrefFor={hrefFor} onOpen={onOpen} />)}
          {sections.map(sectionEntry)}
        </ul>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ manual */

/**
 * A manual: a table of contents with chapters, a search across every page
 * that lands on the section it found, the page itself with its trail and
 * previous/next, and an outline of the page that follows the scroll.
 *
 * Pages are markdown (see `Markdown`). A link from one page to another is
 * written as `[Rechnungen](invoices)`, `[…](invoices.md)` or
 * `[…](invoices#mahnung)` and is followed inside the manual; `#section` links
 * scroll within the page; everything else is left to the browser. A page may
 * name its `sections`: the contents lists them beneath the page, a click
 * scrolls to the heading, and the one being read is marked.
 *
 * `page` and `onPageChange` make it controlled, for a manual whose page is
 * part of the application's address; without them it keeps the page itself.
 * @category content
 */
export function Manual({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  pages,
  page: controlledPage,
  defaultPage,
  onPageChange,
  hrefFor,
  title,
  label,
  className,
  style,
}: ({
  pages: readonly ManualPage[];
  /** Id of the page being read. */
  page?: string | null;
  /** Page to start on when uncontrolled; the first page otherwise. */
  defaultPage?: string;
  onPageChange?: (id: string) => void;
  /** Makes every entry a real link, so a page can be opened in a new tab; a plain click still goes through `onPageChange`. A section entry passes its section too. */
  hrefFor?: (page: ManualPage, section?: ManualSection) => string;
  /** Name of the manual, shown above its contents. */
  title?: ReactNode;
  /** Accessible name of the contents; defaults to the kit's wording. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) & UiMetadataProps) {
  const _ui = uiMetadata("manual", "Browse application help", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const entries = useMemo(() => flatten(pages), [pages]);
  const [internalPage, setInternalPage] = useState<string | null>(defaultPage ?? entries[0]?.page.id ?? null);
  const activeId = controlledPage === undefined ? internalPage : controlledPage;
  const active = entries.find((entry) => entry.page.id === activeId) ?? null;
  const position = active ? entries.indexOf(active) : -1;
  const previous = position > 0 ? entries[position - 1] : null;
  const next = position >= 0 && position < entries.length - 1 ? entries[position + 1] : null;
  const parsed = useMemo(() => (active ? parseMarkdown(active.page.content) : null), [active]);
  const index = useMemo(() => entries.map((entry) => { const { blocks, headings } = parseMarkdown(entry.page.content); return indexPage(entry, blocks, headings); }), [entries]);

  const [query, setQuery] = useState("");
  const hits = useMemo(() => search(index, query), [index, query]);
  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const marked = (parts: Hit["snippet"]) => parts.map((part, at) => part.mark ? <mark key={at} className="rounded-sm bg-warning-soft px-0.5 text-fg">{part.text}</mark> : part.text);
  const [contentsOpen, setContentsOpen] = useState(false);
  const searchField = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  const navId = useId();
  /** A section to scroll to once the page that holds it is on screen. */
  const pending = useRef<string | null>(null);
  /** Set once someone has moved; the page a manual opens on is not scrolled to. */
  const moved = useRef(false);
  /** Set when a search result was chosen: its button is gone, so reading continues in the page. */
  const readOn = useRef(false);

  const scrollTo = useCallback((anchor: string | null) => {
    const target = anchor ? article.current?.querySelector<HTMLElement>(`[id="${anchor}"]`) : article.current;
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
    // A section near the end cannot reach the top, so the heading itself shows where the link went.
    if (anchor && target && typeof target.animate === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      target.animate([{ backgroundColor: "rgb(var(--warning-soft))" }, { backgroundColor: "transparent" }], { duration: 1800, easing: "ease-out" });
    }
  }, []);
  const open = useCallback((id: string, anchor: string | null = null) => {
    moved.current = true;
    pending.current = anchor;
    setContentsOpen(false);
    if (id !== activeId) {
      if (controlledPage === undefined) setInternalPage(id);
      onPageChange?.(id);
    } else scrollTo(anchor);
  }, [activeId, controlledPage, onPageChange, scrollTo]);
  useEffect(() => {
    if (!moved.current) return;
    if (readOn.current) { article.current?.focus({ preventScroll: true }); readOn.current = false; }
    const anchor = pending.current;
    scrollTo(anchor);
    pending.current = null;
    // A picture above the section that finishes loading after the jump pushes the section down; the page follows it until it has settled.
    const body = article.current;
    if (!anchor || !body) return;
    const settle = (event: Event) => { if ((event.target as HTMLElement).tagName === "IMG") body.querySelector<HTMLElement>(`[id="${anchor}"]`)?.scrollIntoView({ block: "start" }); };
    body.addEventListener("load", settle, true);
    const timer = window.setTimeout(() => body.removeEventListener("load", settle, true), 2000);
    return () => { clearTimeout(timer); body.removeEventListener("load", settle, true); };
  }, [activeId, scrollTo]);

  // A plain click on an entry that is a link stays inside; a modified one is the browser's.
  const onOpen = (id: string, anchor: string | null, event: MouseEvent<HTMLElement>) => {
    if (hrefFor && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event.preventDefault();
    open(id, anchor);
  };
  // Links inside a page: `#section`, `page`, `page.md`, `./page#section` are the manual's; the rest is not.
  const onNavigate = (href: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (/^[a-z]+:/i.test(href) || href.startsWith("/")) return;
    const [path = "", anchor = null] = href.split("#");
    const id = path.replace(/^\.\//, "").replace(/\.md$/i, "");
    if (!id) { event.preventDefault(); scrollTo(anchor); return; }
    if (!entries.some((entry) => entry.page.id === id)) return;
    event.preventDefault();
    open(id, anchor);
  };

  const onSearchKey = (event: KeyboardEvent<HTMLElement>) => {
    const items = [...(results.current?.querySelectorAll<HTMLElement>("[data-hit]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape" && query) { event.stopPropagation(); setQuery(""); searchField.current?.focus(); return; }
    if (event.key === "ArrowDown" && items.length) { event.preventDefault(); items[Math.min(items.length - 1, at + 1)]!.focus(); }
    else if (event.key === "ArrowUp" && at >= 0) { event.preventDefault(); if (at === 0) searchField.current?.focus(); else items[at - 1]!.focus(); }
  };
  /** The chapters holding the page being read, and that page, so the contents open to it and to its sections. */
  const openChapters = useMemo(() => new Set([...(active?.trail ?? []), ...(active ? [active.page] : [])].map((page) => page.id)), [active]);
  const outline = useMemo(() => parsed?.headings.filter((heading) => heading.level === 2 || heading.level === 3) ?? [], [parsed]);
  const [current, setCurrent] = useState<string | null>(null);
  /** The listed section being read: the last one whose heading is at or above the heading in view. */
  const readingSection = useMemo(() => {
    const sections = active?.page.sections ?? [];
    if (!sections.length || !parsed || !current) return null;
    const order = parsed.headings.map((heading) => heading.id);
    const at = order.indexOf(current);
    let found: string | null = null;
    for (const item of sections) {
      const position = order.indexOf(item.id);
      if (position >= 0 && position <= at) found = item.id;
    }
    return found;
  }, [active, parsed, current]);
  useEffect(() => {
    // A new page starts with no heading in view; the observer reports the first one as soon as it shows.
    setCurrent(null);
    const body = article.current;
    if (!body || !outline.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver((changes) => {
      for (const change of changes) change.isIntersecting ? visible.add(change.target.id) : visible.delete(change.target.id);
      const first = outline.find((heading) => visible.has(heading.id));
      if (first) setCurrent(first.id);
    }, { rootMargin: "0px 0px -70% 0px" });
    outline.forEach((heading) => { const element = body.querySelector(`[id="${heading.id}"]`); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [parsed, outline]);
  // The page's own first heading is its title; the one the manual draws steps aside for it.
  const ownTitle = parsed?.blocks[0]?.type === "heading" && parsed.blocks[0].level === 1;

  const contents = (
    <>
      <div className="relative">
        <SearchInput ref={searchField} size="sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.manual.search} aria-label={text.manual.search} aria-controls={`${navId}-results`} onKeyDown={onSearchKey} />
      </div>
      {query ? (
        <div ref={results} id={`${navId}-results`} onKeyDown={onSearchKey} className="mt-3 grid gap-0.5">
          <p className="px-2 pb-1 text-2xs font-semibold uppercase tracking-wider text-fg-subtle" role="status">{text.manual.results(hits.length)}</p>
          {hits.map((hit, position) => (
            <button
              key={`${hit.entry.page.id}-${hit.heading?.id ?? "page"}-${position}`}
              type="button"
              data-hit=""
              onClick={() => { readOn.current = true; open(hit.entry.page.id, hit.heading?.id ?? null); setQuery(""); if (hit.entry.page.id === activeId) article.current?.focus({ preventScroll: true }); }}
              className="focus-ring grid gap-0.5 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-subtle"
            >
              <span className="flex min-w-0 items-center gap-1 font-medium text-fg">
                <span className="truncate">{marked(highlight(hit.entry.page.title, terms))}</span>
                {hit.heading && <><CaretRight className="size-3 shrink-0 text-fg-subtle" aria-hidden="true" /><span className="truncate text-fg-muted">{marked(highlight(hit.heading.text, terms))}</span></>}
              </span>
              {hit.snippet.some((part) => part.text) && (
                <span className="line-clamp-2 text-xs text-fg-muted">{marked(hit.snippet)}</span>
              )}
            </button>
          ))}
          {hits.length === 0 && (
            <p className="px-2 py-4 text-sm text-fg-muted">{text.manual.notFoundHint}</p>
          )}
        </div>
      ) : (
        <nav aria-label={label ?? text.manual.contents} className="mt-3">
          <ul className="grid gap-0.5">
            {entries.filter((entry) => entry.depth === 0).map((entry) => <NavEntry key={entry.page.id} entry={entry} active={activeId} section={readingSection} open={openChapters} hrefFor={hrefFor} onOpen={onOpen} />)}
          </ul>
        </nav>
      )}
    </>
  );

  return (
    <div
      className={cn("grid min-h-0 items-start gap-y-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[16rem_minmax(0,1fr)_12rem]", className)}
      style={style}
      // "/" is the way to the search from anywhere in the manual that is not already a field.
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || target.closest("input, textarea, [contenteditable]")) return;
        event.preventDefault();
        searchField.current?.focus();
      }} {..._ui.attributes}
    >
      {/* The contents: a panel beside the page from `lg`, a fold-out above it below. */}
      <div className="lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto lg:py-1 scrollbar-thin">
        <div className="flex items-center gap-2 lg:block">
          <Button variant="outline" size="sm" aria-expanded={contentsOpen} aria-controls={`${navId}-contents`} onClick={() => setContentsOpen((value) => !value)} className="lg:hidden"><ListBullets />{text.manual.showContents}</Button>
          {title && <p className="truncate font-heading text-base font-semibold lg:mb-3">{title}</p>}
        </div>
        <div id={`${navId}-contents`} className={cn(contentsOpen ? "mt-3 block" : "hidden", "lg:mt-0 lg:block")}>{contents}</div>
      </div>

      <article ref={article} tabIndex={-1} className="min-w-0 scroll-mt-4 outline-none">
        {active ? (
          <>
            {active.trail.length > 0 && (
              <Breadcrumbs
                items={[...active.trail, active.page].map((page) => ({ label: page.title, href: hrefFor?.(page) ?? `#${page.id}` }))}
                onNavigate={(crumb) => { const page = active.trail.find((candidate) => (hrefFor?.(candidate) ?? `#${candidate.id}`) === crumb.href); if (page) open(page.id); }}
                className="mb-3"
              />
            )}
            {!ownTitle && <h1 className="mb-4 font-heading text-3xl font-semibold tracking-heading">{active.page.title}</h1>}
            <Markdown source={active.page.content} onNavigate={onNavigate} />
            {(previous || next) && (
              <nav aria-label={`${text.manual.previous} / ${text.manual.next}`} className="mt-10 flex flex-wrap justify-between gap-3 border-t border-border pt-4">
                {previous ? (
                  <Button variant="ghost" onClick={() => open(previous.page.id)} className="max-w-full"><ArrowLeft /><span className="truncate"><span className="text-xs font-normal text-fg-muted">{text.manual.previous} · </span>{previous.page.title}</span></Button>
                ) : <span />}
                {next && (
                  <Button variant="ghost" onClick={() => open(next.page.id)} className="max-w-full"><span className="truncate"><span className="text-xs font-normal text-fg-muted">{text.manual.next} · </span>{next.page.title}</span><ArrowRight /></Button>
                )}
              </nav>
            )}
          </>
        ) : (
          <EmptyState icon={MagnifyingGlass} title={text.manual.notFound} description={text.manual.notFoundHint} />
        )}
      </article>

      {outline.length > 1 && (
        <nav aria-label={text.manual.onThisPage} className="sticky top-0 hidden max-h-screen overflow-y-auto py-1 xl:block">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{text.manual.onThisPage}</p>
          <ul className="grid gap-0.5 border-l border-border">
            {outline.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  aria-current={current === heading.id ? "location" : undefined}
                  onClick={(event) => { event.preventDefault(); scrollTo(heading.id); }}
                  className={cn(
                    "focus-ring -ml-px block truncate border-l-2 py-1 pr-2 text-sm transition-colors",
                    heading.level === 3 ? "pl-6" : "pl-3",
                    current === heading.id ? "border-primary font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg",
                  )}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

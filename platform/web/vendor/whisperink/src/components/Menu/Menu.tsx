import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useContext, useEffect, useRef } from "react";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { PopoverOpenedContext } from "../Popover/popover-context.js";
import { Popover } from "../Popover/Popover.js";

const MENU_ITEM = '[role^="menuitem"]:not([disabled]):not([aria-disabled="true"])';

/**
 * Dropdown menu: focus moves into it on open, arrow keys, Home and End rove,
 * typing jumps to the entry that starts with what was typed, and Escape, Tab,
 * choosing an entry or a press outside close it.
 * @category menu
 */
export function Menu({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  trigger,
  align = "end",
  side,
  className,
  children,
  defaultOpen,
}: ({
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  align?: "start" | "end";
  /** Preferred side; the other one is used when this one has no room. */
  side?: "bottom" | "top";
  /** Sizing for the panel itself, e.g. a width that suits what is listed in it. */
  className?: string;
  children: ReactNode;
  /** Mounts it open, for documentation; see `Popover`. */
  defaultOpen?: boolean;
}) & UiMetadataProps) {
  const _ui = uiMetadata("menu", "Choose an action", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <Popover trigger={trigger} align={align} side={side} className={className} defaultOpen={defaultOpen} {..._ui.props}>
      {(close) => <MenuList close={close}>{children}</MenuList>}
    </Popover>
  );
}

function MenuList({ close, children }: { close: () => void; children: ReactNode }) {
  const list = useRef<HTMLDivElement>(null);
  const opened = useContext(PopoverOpenedContext);
  const typed = useRef({ text: "", at: 0 });
  // A menu someone opened takes focus. One that documentation mounts open
  // leaves it alone, or a page of specimens would fight over it on load.
  useEffect(() => {
    if (opened && list.current && !list.current.contains(document.activeElement)) list.current.querySelector<HTMLElement>(MENU_ITEM)?.focus();
  }, [opened]);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") return close();
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(MENU_ITEM)];
    if (!items.length || event.ctrlKey || event.metaKey || event.altKey) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    if (event.key === "ArrowDown") next = items[(index + 1) % items.length];
    else if (event.key === "ArrowUp") next = items[index <= 0 ? items.length - 1 : index - 1];
    else if (event.key === "Home") next = items[0];
    else if (event.key === "End") next = items[items.length - 1];
    else if (event.key.length === 1 && event.key !== " ") {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 600 ? event.key : typed.current.text + event.key, at: now };
      const needle = typed.current.text.toLocaleLowerCase();
      // A first letter moves on from the current entry, so pressing it again cycles.
      const from = needle.length === 1 ? index + 1 : Math.max(index, 0);
      next = [...items.slice(from), ...items.slice(0, from)].find((item) => item.textContent?.trim().toLocaleLowerCase().startsWith(needle));
      if (!next) return;
    } else return;
    event.preventDefault();
    next?.focus();
  };
  return (
    <div
      ref={list}
      role="menu"
      onKeyDown={onKeyDown}
      // Only an entry closes the menu; its labels, separators and disabled entries do not.
      onClick={(event) => { if ((event.target as HTMLElement).closest(MENU_ITEM)) close(); }}
      className="grid outline-none"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

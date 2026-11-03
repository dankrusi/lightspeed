import type { MouseEvent, ReactNode } from "react";
import { cn } from "../../cn.js";
import { CaretRight, DotsThree } from "../../icons.js";
import { useText } from "../../text.js";
import { itemMetadata, uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";
import { Menu } from "../Menu/Menu.js";
import { MenuItem } from "../Menu/MenuItem.js";

/** One level of the trail. Its metadata identifies the crumb, in the trail or in the menu of collapsed ones. */
export type Crumb = UiMetadataProps & { label: string; href?: string };

/**
 * Breadcrumb trail. Long trails collapse the middle into an ellipsis menu
 * instead of truncating labels. A crumb with an `href` is a real link, so
 * middle-click and "open in new tab" work; `onNavigate` lets a client-side
 * router take over the plain left click. A crumb without one is plain text:
 * a link that goes nowhere is not offered as one.
 * @category navigation
 */
export function Breadcrumbs({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  items,
  maxVisible = 4,
  separator: separatorContent = <CaretRight className="size-3.5" />,
  onNavigate,
  className,
}: ({
  items: readonly Crumb[];
  maxVisible?: number;
  /** Decorative content between levels; defaults to a chevron icon. */
  separator?: ReactNode;
  /** Called instead of a full page load when a crumb with an `href` is activated. */
  onNavigate?: (item: Crumb) => void;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("breadcrumbs", "Show the navigation path", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const collapsed = items.length > maxVisible;
  const head = collapsed ? items.slice(0, 1) : [];
  const hidden = collapsed ? items.slice(1, items.length - (maxVisible - 2)) : [];
  const tail = collapsed ? items.slice(items.length - (maxVisible - 2)) : items;
  const activate = (item: Crumb) => (event: MouseEvent<HTMLElement>) => {
    if (!onNavigate || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(item);
  };
  const render = (item: Crumb, current: boolean) => {
    const metadata = uiMetadata("breadcrumb", "Go to one level of the path", item).attributes;
    return current ? (
      <span aria-current="page" className="truncate font-medium text-fg" {...metadata}>{item.label}</span>
    ) : item.href === undefined ? (
      <span className="truncate text-fg-muted" {...metadata}>{item.label}</span>
    ) : (
      <a href={item.href} onClick={activate(item)} className="focus-ring truncate rounded text-fg-muted transition-colors hover:text-fg" {...metadata}>{item.label}</a>
    );
  };
  const text = useText();
  const separator = <span className="flex shrink-0 items-center text-fg-subtle" aria-hidden="true">{separatorContent}</span>;
  return (
    <nav aria-label={text.nav.breadcrumb} className={cn("min-w-0", className)} {..._ui.attributes}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {head.map((item, index) => (
          <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-1.5">{render(item, false)}{separator}</li>
        ))}
        {hidden.length > 0 && (
          <li className="flex items-center gap-1.5">
            <Menu align="start" trigger={({ toggle, open }) => <IconButton label={text.nav.moreCrumbs} size="sm" onClick={toggle} aria-haspopup="menu" aria-expanded={open} className="size-6"><DotsThree className="size-4" /></IconButton>}>
              {hidden.map((item, index) => (
                <MenuItem key={`${index}-${item.label}`} {...itemMetadata(item)} href={item.href} disabled={item.href === undefined} onClick={item.href && onNavigate ? activate(item) : undefined}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
            {separator}
          </li>
        )}
        {tail.map((item, index) => (
          <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-1.5">
            {render(item, index === tail.length - 1)}
            {index < tail.length - 1 && separator}
          </li>
        ))}
      </ol>
    </nav>
  );
}

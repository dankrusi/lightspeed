import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Icon, IconWeight } from "@phosphor-icons/react";

const WEIGHTS: IconWeight[] = ["thin", "light", "regular", "bold", "fill", "duotone"];

/// Phosphor icons carry no name in the DOM, so an icon is recognized by its
/// path data, in whichever weight the surrounding context renders it.
function paths(icon: Icon): string[] {
  return WEIGHTS.flatMap((weight) => {
    const markup = renderToStaticMarkup(createElement(icon, { weight }));
    return [...markup.matchAll(/ d="([^"]+)"/g)].map((match) => match[1]!);
  });
}

/// Whether `html` (an element's markup or a rendered string) contains `icon`.
export function hasIcon(html: string | Element | null | undefined, icon: Icon): boolean {
  if (!html) return false;
  const markup = typeof html === "string" ? html : html.outerHTML;
  return paths(icon).some((d) => markup.includes(`d="${d}"`));
}

/// The first svg inside `root` that draws `icon`.
export function findIcon(root: ParentNode, icon: Icon): SVGSVGElement | null {
  return [...root.querySelectorAll("svg")].find((svg) => hasIcon(svg, icon)) ?? null;
}

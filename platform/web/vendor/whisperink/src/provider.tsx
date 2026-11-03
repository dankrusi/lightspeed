import { type ReactNode, useMemo } from "react";
import { CalendarMarkersProvider } from "./components/Calendar/CalendarMarkersProvider.js";
import type { CalendarMarkerLoader } from "./components/Calendar/markers.js";
import { ToastProvider } from "./components/Toast/ToastProvider.js";
import { IconProvider } from "./icons.js";
import { setLocale } from "./intl.js";
import { mergeText, TextContext, type TextOverrides } from "./text.js";

/**
 * One wrapper for everything the kit needs from its host: the icon weight, the
 * toast outlet, the locale it formats in, the copy it renders, and the dates it
 * should mark. Mount it once, above the application.
 *
 * Every part is optional. Without a host the kit still renders — light icons,
 * English copy, `en-GB` formatting — so a component works in isolation, in a
 * test, and in documentation. For Swiss German pass `text={swissGermanText}`
 * and `locale="de-CH"`.
 */
export function WhisperinkProvider({
  locale = "en-GB",
  text,
  markers,
  toasts = true,
  children,
}: {
  /** BCP 47 tag used for every date the kit formats. */
  locale?: string;
  /** Replaces individual pieces of the kit's copy; the rest stays as shipped. */
  text?: TextOverrides;
  /** Dates the host already knows about, for the range a calendar is showing. */
  markers?: CalendarMarkerLoader;
  /** Renders the toast outlet; turn it off when the host owns its own. */
  toasts?: boolean;
  children: ReactNode;
}) {
  // Written during render, before any child reads it, so the first paint is
  // already in the right locale. The setter ignores an unchanged value, which
  // is what makes this safe to run on every render.
  setLocale(locale);
  const resolved = useMemo(() => mergeText(text), [text]);
  const content = (
    <IconProvider>
      <TextContext.Provider value={resolved}>
        <CalendarMarkersProvider load={markers}>{children}</CalendarMarkersProvider>
      </TextContext.Provider>
    </IconProvider>
  );
  return toasts ? <ToastProvider>{content}</ToastProvider> : content;
}

// @ts-nocheck
// Host typecheck uses noUncheckedIndexedAccess; this kit file does not.
import { useMemo, useSyncExternalStore } from "react";

/**
 * Active locale for everything the kit formats. It is a module-level store
 * rather than context alone because the date helpers are pure functions that
 * callers use outside a component, and both have to agree on one answer.
 *
 * `WhisperinkProvider` writes it; nothing else should.
 */

const fallbackLocale = "en-GB";

let current = fallbackLocale;
const listeners = new Set<() => void>();

export function locale(): string {
  return current;
}

export function setLocale(next: string): void {
  const resolved = next.trim() || fallbackLocale;
  if (resolved === current) return;
  current = resolved;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders the caller when the application switches locale. */
export function useLocale(): string {
  return useSyncExternalStore(subscribe, locale, () => fallbackLocale);
}

/** A known Monday, so weekday names come out Monday-first like the grids. */
const mondayReference = new Date(2024, 0, 1, 12);

function nameList(count: number, format: (index: number) => Date, options: Intl.DateTimeFormatOptions, at: string): string[] {
  const formatter = new Intl.DateTimeFormat(at, options);
  return Array.from({ length: count }, (_, index) => formatter.format(format(index)));
}

export function weekdayNames(at: string = locale(), style: "short" | "long" = "short"): string[] {
  return nameList(
    7,
    (index) => new Date(mondayReference.getTime() + index * 86_400_000),
    { weekday: style },
    at,
  );
}

export function monthNames(at: string = locale(), style: "long" | "short" = "long"): string[] {
  return nameList(12, (index) => new Date(2024, index, 1, 12), { month: style }, at);
}

/** Weekday and month names for the active locale, computed once per locale. */
export function useDateNames(): { weekdays: string[]; months: string[] } {
  const at = useLocale();
  return useMemo(() => ({ weekdays: weekdayNames(at), months: monthNames(at) }), [at]);
}

function fromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Formats an ISO day in the active locale; empty string for a missing date. */
export function formatDate(
  iso: string | null,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
  at: string = locale(),
): string {
  return iso ? new Intl.DateTimeFormat(at, options).format(fromIso(iso)) : "";
}

type DatePart = "day" | "month" | "year";

/** The order the locale writes a numeric date in, e.g. day, month, year for de-CH and month, day, year for en-US. */
function dateOrder(at: string): DatePart[] {
  return new Intl.DateTimeFormat(at, { day: "2-digit", month: "2-digit", year: "numeric" })
    .formatToParts(mondayReference)
    .flatMap((part) => (part.type === "day" || part.type === "month" || part.type === "year" ? [part.type] : []));
}

/**
 * Reads a date the way it is typed in the active locale and returns it as an
 * ISO day, or `null` when it is not one.
 *
 * Accepts the locale's numeric order with any separator ("30.9.2026",
 * "30/09/26"), the same without separators ("30092026", "300926"), a day and
 * month alone ("30.9.", "3009") meaning this year, and ISO ("2026-09-30")
 * regardless of locale. A two-digit year is the one nearest to today. The
 * text may carry a weekday or other words; only its numbers are read.
 */
export function parseDate(text: string, at: string = locale(), reference: Date = new Date()): string | null {
  const digits: string[] = text.match(/\d+/g) ?? [];
  if (!digits.length) return null;
  const order = dateOrder(at);
  const compact = digits.length === 1 && /^\d+$/.test(text.trim());
  let parts: string[];
  let names: DatePart[];
  if (digits.length === 1 && !compact) return null;
  if (compact) {
    // Run together, so the locale's order says where each part starts and the year is the wide one.
    const run = digits[0];
    if (run.length === 4) { parts = [run.slice(0, 2), run.slice(2, 4)]; names = order.filter((part) => part !== "year"); }
    else if (run.length === 6 || run.length === 8) {
      const widths = order.map((part) => (part === "year" ? run.length - 4 : 2));
      let cursor = 0;
      parts = widths.map((width) => { const piece = run.slice(cursor, cursor + width); cursor += width; return piece; });
      names = order;
    } else return null;
  } else if (digits.length === 3 && digits[0].length === 4) {
    parts = digits;
    names = ["year", "month", "day"];
  } else if (digits.length === 3) {
    parts = digits;
    names = order;
  } else if (digits.length === 2) {
    parts = digits;
    names = order.filter((part) => part !== "year");
  } else return null;
  const field = (name: DatePart) => { const index = names.indexOf(name); return index === -1 ? undefined : Number(parts[index]); };
  const day = field("day");
  const month = field("month");
  let year = field("year") ?? reference.getFullYear();
  if (day === undefined || month === undefined || Number.isNaN(day) || Number.isNaN(month)) return null;
  if (year < 100) {
    // "26" is 2026 and "98" is 1998: the century that lands nearest to now.
    const century = Math.floor(reference.getFullYear() / 100) * 100;
    year += century;
    if (year - reference.getFullYear() > 50) year -= 100;
    else if (reference.getFullYear() - year > 50) year += 100;
  }
  if (month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate() || year < 1000 || year > 9999) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

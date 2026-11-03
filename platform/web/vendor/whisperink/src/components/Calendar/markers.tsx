import { createContext, useContext, useEffect, useState } from "react";

export type MarkerKind = "item" | "task" | "deadline" | "project-start" | "project-end";
export type CalendarMarker = { date: string; tone: "neutral" | "success" | "warning" | "danger" | "info"; label: string; kind?: MarkerKind; context?: string; done?: boolean };

/** What a date field is for; every role but `date` reads the surrounding pair. */
export type DateRole = "date" | "start" | "end" | "deadline";

/**
 * The span a date belongs to. A field shows every date of the pair it does not
 * own itself — a deadline shows both ends, a start shows the end — and honours
 * it as a bound.
 */
export type DatePair = {
  start?: string | null;
  end?: string | null;
  startLabel?: string;
  endLabel?: string;
  /**
   * Sets the other end of the pair. Given it, the picker offers to fill that
   * end straight away when it is still empty, instead of closing on a span
   * that only has one side.
   */
  onFill?: (role: "start" | "end", value: string) => void;
};
/** Highlighted span in a calendar; open ends are simply not highlighted. */
export type DateRange = { start: string | null; end: string | null };

export type CalendarMarkerLoader = (
  from: string,
  to: string,
) => Promise<readonly CalendarMarker[]>;

export const CalendarMarkersContext = createContext<CalendarMarkerLoader | undefined>(undefined);

export function useRangeMarkers(
  from: string,
  to: string,
  local: readonly CalendarMarker[],
): readonly CalendarMarker[] {
  const load = useContext(CalendarMarkersContext);
  const [loaded, setLoaded] = useState<readonly CalendarMarker[]>([]);
  useEffect(() => {
    if (!load) return;
    let active = true;
    // A failing source leaves the calendar usable with the markers it was given.
    load(from, to).then(
      (items) => { if (active) setLoaded(items); },
      () => { if (active) setLoaded([]); },
    );
    return () => { active = false; };
  }, [from, load, to]);
  return loaded.length === 0 ? local : [...local, ...loaded];
}

/** Where a day sits in a highlighted span, for the band the calendars draw. */
type SpanPosition = "start" | "end" | "inside" | "only";

export function rangePosition(day: string, range?: DateRange): SpanPosition | null {
  const start = range?.start ?? null;
  const end = range?.end ?? null;
  if (!start || !end || start > end) return null;
  if (day === start && day === end) return "only";
  if (day === start) return "start";
  if (day === end) return "end";
  return day > start && day < end ? "inside" : null;
}

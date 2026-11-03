import type { ReactNode } from "react";
import { type CalendarMarkerLoader, CalendarMarkersContext } from "./markers.js";

/**
 * Publishes one loader for the dates an application already knows about, so
 * every calendar in it shows the same context and no caller has to fetch.
 * Calendars ask for exactly the range they are showing and merge the result
 * with the markers they were handed directly.
 * @category calendar
 */
export function CalendarMarkersProvider({
  load,
  children,
}: {
  load?: CalendarMarkerLoader;
  children: ReactNode;
}) {
  return <CalendarMarkersContext.Provider value={load}>{children}</CalendarMarkersContext.Provider>;
}

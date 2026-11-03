import { cn } from "../../cn.js";
import { CaretLeft, CaretRight } from "../../icons.js";
import { formatDate, useDateNames } from "../../intl.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";
import { addDays, fromIso, startOfWeek, today } from "./dates.js";
import type { CalendarMarker } from "./markers.js";

/**
 * Seven-day strip for the time-tracking landing page.
 * @category calendar
 */
export function WeekStrip({ uiId, uiDescription, uiComponentId, uiComponentDescription, value, onChange, markers = [] }: ({ value: string; onChange: (value: string) => void; markers?: readonly CalendarMarker[] }) & UiMetadataProps) {
  const _ui = uiMetadata("week-strip", "Choose a day of the week", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  const { weekdays } = useDateNames();
  const start = startOfWeek(value);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const current = today();
  return (
    <div className="flex items-center gap-1" {..._ui.attributes}>
      <IconButton label={text.calendar.previousWeek} size="sm" onClick={() => onChange(addDays(value, -7))}><CaretLeft /></IconButton>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map((day, index) => {
          const selected = day === value;
          const count = markers.filter((marker) => marker.date === day).length;
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              aria-current={day === current ? "date" : undefined}
              aria-label={formatDate(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              onClick={() => onChange(day)}
              className={cn(
                "focus-ring flex flex-col items-center rounded-md border py-2 text-sm transition-colors",
                selected ? "border-primary bg-primary text-primary-fg" : day === current ? "border-border-strong hover:bg-subtle" : "border-border hover:bg-subtle",
                index >= 5 && !selected && "bg-subtle/50",
              )}
            >
              <span className={cn("text-2xs font-medium uppercase", selected ? "text-primary-fg/70" : day === current ? "font-semibold text-fg" : "text-fg-subtle")}>{weekdays[index]}</span>
              <span className="font-semibold tabular-nums">{fromIso(day).getDate()}</span>
              <span className={cn("mt-1 h-1 w-4 rounded-full", count ? (selected ? "bg-primary-fg/60" : "bg-fg-subtle") : "bg-transparent")} />
            </button>
          );
        })}
      </div>
      <IconButton label={text.calendar.nextWeek} size="sm" onClick={() => onChange(addDays(value, 7))}><CaretRight /></IconButton>
    </div>
  );
}

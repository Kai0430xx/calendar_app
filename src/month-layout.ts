import { lastDate, type EventRange } from "./date-range.ts";
export function weekSegments<T extends EventRange & { id: string }>(
  events: T[],
  dates: string[],
) {
  const segments = events
    .filter((e) => e.date <= dates[6] && lastDate(e) >= dates[0])
    .map((event) => ({
      event,
      start: Math.max(
        0,
        dates.findIndex((day) => day >= event.date),
      ),
      end: dates.reduce(
        (last, day, index) => (day <= lastDate(event) ? index : last),
        0,
      ),
      lane: 0,
    }))
    .sort(
      (a, b) =>
        a.event.date.localeCompare(b.event.date) ||
        b.end - a.end ||
        a.event.id.localeCompare(b.event.id),
    );
  const occupied: number[] = [];
  for (const segment of segments) {
    let lane = occupied.findIndex((end) => end < segment.start);
    if (lane < 0) lane = occupied.length;
    occupied[lane] = segment.end;
    segment.lane = lane;
  }
  return segments;
}

import { compareEvents, lastDate, type EventRange } from "./date-range.ts";
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
    .sort((a, b) => compareEvents(a.event, b.event));
  const occupied: { start: number; end: number }[][] = [];
  for (const segment of segments) {
    let lane = occupied.findIndex((intervals) =>
      intervals.every(
        (interval) =>
          interval.end < segment.start || interval.start > segment.end,
      ),
    );
    if (lane < 0) {
      lane = occupied.length;
      occupied.push([]);
    }
    occupied[lane].push({ start: segment.start, end: segment.end });
    segment.lane = lane;
  }
  return segments;
}

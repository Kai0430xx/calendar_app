export type EventRange = {
  date: string;
  endDate?: string;
  start: string;
  end: string;
  allDay: boolean;
};
export const lastDate = (event: EventRange) => event.endDate || event.date;
export const coversDate = (event: EventRange, day: string) =>
  event.date <= day && day <= lastDate(event);
export function rangeError(event: EventRange) {
  if (lastDate(event) < event.date) return "結束日期不可早於開始日期";
  if (
    !event.allDay &&
    event.end &&
    lastDate(event) === event.date &&
    event.end <= event.start
  )
    return "結束時間需晚於開始時間";
  return "";
}
export function timeOnDate(event: EventRange, day: string) {
  if (event.allDay) return "全天";
  if (lastDate(event) === event.date)
    return event.start + (event.end ? " – " + event.end : "");
  if (day === event.date) return event.start + " 開始";
  if (day === lastDate(event)) return event.end ? event.end + " 結束" : "跨日";
  return "跨日";
}

export function compareEvents(
  a: EventRange & { id: string },
  b: EventRange & { id: string },
) {
  return (
    Number(b.allDay) - Number(a.allDay) ||
    a.date.localeCompare(b.date) ||
    (a.allDay ? 0 : a.start.localeCompare(b.start)) ||
    a.id.localeCompare(b.id)
  );
}

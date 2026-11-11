import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coversDate,
  lastDate,
  rangeError,
  timeOnDate,
} from "../src/date-range.ts";
const event = {
  date: "2026-11-13",
  endDate: "2026-11-15",
  start: "18:00",
  end: "09:00",
  allDay: false,
};
test("three-day event includes both boundaries and middle, excludes adjacent days", () => {
  for (const day of ["2026-11-13", "2026-11-14", "2026-11-15"])
    assert.equal(coversDate(event, day), true);
  for (const day of ["2026-11-12", "2026-11-16"])
    assert.equal(coversDate(event, day), false);
});
test("cross-month and cross-year dates remain inclusive", () => {
  const e = { ...event, date: "2026-12-31", endDate: "2027-01-02" };
  assert.equal(coversDate(e, "2027-01-01"), true);
  assert.equal(coversDate(e, "2027-01-02"), true);
  assert.equal(coversDate(e, "2027-01-03"), false);
});
test("legacy events without endDate are single-day", () => {
  const { endDate, ...legacy } = event;
  assert.equal(lastDate(legacy), legacy.date);
  assert.equal(coversDate(legacy, "2026-11-14"), false);
});
test("next-day earlier time is valid; same-day earlier or equal time is rejected", () => {
  assert.equal(rangeError(event), "");
  for (const end of ["09:00", "18:00"])
    assert.equal(
      rangeError({ ...event, endDate: event.date, end }),
      "結束時間需晚於開始時間",
    );
  assert.equal(rangeError({ ...event, endDate: event.date, end: "19:00" }), "");
});
test("reversed dates are rejected even for all-day events", () => {
  assert.equal(
    rangeError({ ...event, endDate: "2026-11-12", allDay: true }),
    "結束日期不可早於開始日期",
  );
});
test("all-day ranges and optional end time are valid", () => {
  assert.equal(rangeError({ ...event, allDay: true }), "");
  assert.equal(rangeError({ ...event, end: "" }), "");
  assert.equal(timeOnDate({ ...event, allDay: true }, "2026-11-14"), "全天");
});
test("daily labels distinguish start, continuation, and end", () => {
  assert.equal(timeOnDate(event, "2026-11-13"), "18:00 開始");
  assert.equal(timeOnDate(event, "2026-11-14"), "跨日");
  assert.equal(timeOnDate(event, "2026-11-15"), "09:00 結束");
  assert.equal(timeOnDate({ ...event, end: "" }, "2026-11-15"), "跨日");
});

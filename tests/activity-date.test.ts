import { describe, expect, it } from "vitest";
import { formatActivitySchedule, getActivityDate } from "@/lib/activity-date";

describe("activity dates in Beijing time", () => {
  it("formats a readable same-day schedule", () => {
    expect(formatActivitySchedule(new Date("2026-09-05T11:00:00Z"), new Date("2026-09-05T13:30:00Z")))
      .toEqual({ dateLabel: "2026.09.05（周六）", timeLabel: "19:00 – 21:30" });
  });
  it("uses the local calendar day across UTC midnight", () => {
    expect(getActivityDate("2026-09-05T17:00:00Z")).toMatchObject({ month: "09", day: "06", weekday: "SUN" });
  });
  it("preserves the end date for overnight events", () => {
    expect(formatActivitySchedule(new Date("2026-09-05T15:00:00Z"), new Date("2026-09-05T17:00:00Z")).timeLabel)
      .toBe("09.05 23:00\n— 09.06 01:00");
  });
  it("handles unscheduled events", () => {
    expect(formatActivitySchedule()).toEqual({ dateLabel: "时间待定", timeLabel: null });
    expect(getActivityDate("invalid")).toBeNull();
  });
});

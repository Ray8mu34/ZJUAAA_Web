import { describe, expect, it } from "vitest";
import { isActivityEnded, shouldShowInActivityArchive } from "@/lib/activity-visibility";

const now = new Date("2026-09-08T12:00:00Z");

describe("activity visibility", () => {
  it("keeps future activities out of the archive even when preselected", () => {
    const activity = { startAt: new Date("2026-09-09T12:00:00Z"), endAt: null, isArchived: true };
    expect(isActivityEnded(activity, now)).toBe(false);
    expect(shouldShowInActivityArchive(activity, now)).toBe(false);
  });

  it("archives only ended activities that were selected", () => {
    const timing = { startAt: new Date("2026-09-07T12:00:00Z"), endAt: null };
    expect(shouldShowInActivityArchive({ ...timing, isArchived: true }, now)).toBe(true);
    expect(shouldShowInActivityArchive({ ...timing, isArchived: false }, now)).toBe(false);
  });

  it("uses end time when an activity has one", () => {
    const activity = {
      startAt: new Date("2026-09-08T10:00:00Z"),
      endAt: new Date("2026-09-08T14:00:00Z"),
      isArchived: true
    };
    expect(shouldShowInActivityArchive(activity, now)).toBe(false);
  });
});

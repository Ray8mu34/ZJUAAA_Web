import { describe, expect, it } from "vitest";

import {
  formatKnowledgePublishedAtInput,
  parseKnowledgePublishedAtInput
} from "@/lib/knowledge-post-date";

describe("knowledge post publication dates", () => {
  it("parses an admin date as Shanghai local time", () => {
    expect(parseKnowledgePublishedAtInput("2023-04-09T14:30")?.toISOString()).toBe("2023-04-09T06:30:00.000Z");
  });

  it("formats stored dates for the Shanghai admin input", () => {
    expect(formatKnowledgePublishedAtInput(new Date("2023-04-09T16:30:00.000Z"))).toBe("2023-04-10T00:30");
  });

  it("allows the publication date to be cleared", () => {
    expect(parseKnowledgePublishedAtInput(" ")).toBeNull();
    expect(formatKnowledgePublishedAtInput(null)).toBe("");
  });

  it("rejects invalid calendar dates", () => {
    expect(() => parseKnowledgePublishedAtInput("2023-02-30T12:00")).toThrow("原始发布时间不是有效日期。");
  });
});

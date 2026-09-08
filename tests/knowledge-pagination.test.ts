import { describe, expect, it } from "vitest";

import { getKnowledgePaginationItems } from "@/components/site/knowledge-pagination";

describe("knowledge pagination", () => {
  it("shows every page for short result sets", () => {
    expect(getKnowledgePaginationItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the current page and boundaries for long result sets", () => {
    expect(getKnowledgePaginationItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("does not add an ellipsis for a single missing page", () => {
    expect(getKnowledgePaginationItems(3, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10]);
  });
});

import { describe, expect, it } from "vitest";

import { parseAboutGalleryPaths, parseAlumniGroups, sortAlumniGroups } from "@/lib/about-content";

describe("about page content", () => {
  it("parses gallery paths without blank rows", () => {
    expect(parseAboutGalleryPaths(" /uploads/a.jpg\n\n/uploads/b.jpg ")).toEqual([
      "/uploads/a.jpg",
      "/uploads/b.jpg"
    ]);
  });

  it("filters malformed alumni entries", () => {
    expect(
      parseAlumniGroups(JSON.stringify([{ year: "2025", members: [{ name: "张三", role: "会长" }, { role: "无姓名" }] }]))
    ).toEqual([{ year: "2025", members: [{ name: "张三", role: "会长", photoPath: "" }] }]);
  });

  it("sorts alumni years from newest to oldest", () => {
    const groups = parseAlumniGroups(
      JSON.stringify([
        { year: "2022 届", members: [{ name: "甲", role: "" }] },
        { year: "2025 届", members: [{ name: "乙", role: "" }] }
      ])
    );

    expect(sortAlumniGroups(groups).map((group) => group.year)).toEqual(["2025 届", "2022 届"]);
  });
});

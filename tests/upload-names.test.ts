import { describe, expect, it, vi } from "vitest";

import { createStoredFilename, getSafeUploadBaseName } from "@/lib/upload-names";

describe("upload name helpers", () => {
  it("sanitizes unsafe basename characters while preserving Chinese text", () => {
    expect(getSafeUploadBaseName("月球 照片?.png", ".png")).toBe("月球-照片-");
  });

  it("creates a timestamped stored filename without duplicating extensions", () => {
    vi.spyOn(Date, "now").mockReturnValue(1234567890);

    expect(createStoredFilename("moon.png", { includeUuid: false })).toBe("1234567890-moon.png");

    vi.restoreAllMocks();
  });
});

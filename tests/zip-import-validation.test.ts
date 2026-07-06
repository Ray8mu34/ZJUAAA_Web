import { describe, expect, it } from "vitest";

import {
  MAX_IMPORT_FILE_COUNT,
  MAX_IMPORT_UNCOMPRESSED_BYTES,
  validateZipImportEntries,
  ZipImportValidationError
} from "@/lib/zip-import-validation";

function entry(entryName: string, size = 1) {
  return {
    entryName,
    isDirectory: false,
    header: { size }
  };
}

describe("validateZipImportEntries", () => {
  it("accepts ordinary manual import paths", () => {
    expect(() =>
      validateZipImportEntries([entry("manual/01-intro.md"), entry("manual/images/moon.png", 1024)])
    ).not.toThrow();
  });

  it("rejects path traversal", () => {
    expect(() => validateZipImportEntries([entry("../escape.md")])).toThrow(ZipImportValidationError);
  });

  it("rejects too many files", () => {
    const entries = Array.from({ length: MAX_IMPORT_FILE_COUNT + 1 }, (_, index) => entry(`manual/${index}.md`));

    expect(() => validateZipImportEntries(entries)).toThrow("文件数量超过");
  });

  it("rejects oversized uncompressed imports", () => {
    expect(() => validateZipImportEntries([entry("manual/large.md", MAX_IMPORT_UNCOMPRESSED_BYTES + 1)])).toThrow(
      "解压后的总大小超过"
    );
  });
});

export class ZipImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipImportValidationError";
  }
}

export const MAX_IMPORT_FILE_COUNT = 300;
export const MAX_IMPORT_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;

type ZipEntryLike = {
  entryName: string;
  isDirectory: boolean;
  header: {
    size: number;
  };
};

function isUnsafeZipEntryName(entryName: string) {
  const normalized = entryName.replaceAll("\\", "/");
  const parts = normalized.split("/");

  return (
    entryName.includes("\\") ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    parts.some((part) => part === "..")
  );
}

export function validateZipImportEntries(entries: ZipEntryLike[]) {
  const files = entries.filter((entry) => !entry.isDirectory);

  if (files.length > MAX_IMPORT_FILE_COUNT) {
    throw new ZipImportValidationError(`ZIP 文件数量超过 ${MAX_IMPORT_FILE_COUNT} 个，请拆分后再导入。`);
  }

  let totalUncompressedSize = 0;

  for (const entry of files) {
    if (isUnsafeZipEntryName(entry.entryName)) {
      throw new ZipImportValidationError(`ZIP 中包含不安全路径：${entry.entryName}`);
    }

    totalUncompressedSize += entry.header.size;
  }

  if (totalUncompressedSize > MAX_IMPORT_UNCOMPRESSED_BYTES) {
    throw new ZipImportValidationError("ZIP 解压后的总大小超过 512M，请拆分后再导入。");
  }
}
